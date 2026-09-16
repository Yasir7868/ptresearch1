"use client";

/**
 * lib/cart.tsx — Commerce cart adapter + React context.
 *
 * Design contract: the design layer never couples to a specific backend.
 * CartAdapter is the seam. The stub (LocalStorageCartAdapter) works today;
 * swap it for a WooCommerceCartAdapter (WC Store API) with zero component
 * changes — just pass the adapter to <CartProvider>.
 *
 * Item identity: `${sku}__${dose}` — one row per variant, not per SKU.
 * All money values are integer minor units (cents) to avoid float drift.
 * `totals.currencyMinorUnit` follows the WC Store API convention: the number
 * of decimal places in the currency (2 for USD).
 *
 * TOTALS ARE ADAPTER-CANONICAL. The LocalStorage adapter computes totals
 * locally (BOGO-50%, the PT25 coupon, the free-shipping threshold — constants
 * from content/brand-config.ts). That IS correct for the prototype; the
 * future WooCommerceCartAdapter will return SERVER-canonical totals from
 * `/wp-json/wc/store/v1/cart` responses instead, and no component changes.
 *
 * Usage:
 *   // Root layout — wraps the chrome (no adapter = localStorage stub):
 *   <CartProvider>{children}</CartProvider>
 *
 *   // Inside the provider tree:
 *   const { items, count, subtotal, totals, addItem, removeItem, updateQty,
 *           applyCoupon, removeCoupon, clear } = useCart();
 *
 *   // Safe outside the provider (e.g. Nav before hydration):
 *   const cart = useCartOptional(); // null if no provider above
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { brandConfig } from "@/content/brand-config";

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

/** A single cart line, uniquely keyed by `${sku}__${dose}`. */
export interface CartItem {
  /** Stable identity: `${sku}__${dose}`. Used for all mutations. */
  key: string;
  sku: string;
  dose: string;
  /** DISPLAY name — already run through the catalog mapper's overrides. */
  name: string;
  /** Unit price in minor units (cents). Avoids float drift across qty updates. */
  price: number;
  qty: number;
  image?: string | undefined;
  /** WooCommerce numeric product id — carried for the future Woo adapter. */
  productId?: number | undefined;
  /** WooCommerce variation id, when the line is a variation. */
  variationId?: number | undefined;
}

/** Payload the product UI passes to addItem. key is derived internally. */
export interface AddItemInput {
  sku: string;
  dose: string;
  name: string;
  /** Unit price in minor units (cents). */
  price: number;
  /** WooCommerce numeric product id (from the catalog mapper). */
  productId: number;
  /** WooCommerce variation id, when adding a specific variation. */
  variationId?: number | undefined;
  /**
   * WC Store API variation selection, e.g.
   * [{ attribute: "Size", value: "10mg" }]. Ignored by the LocalStorage
   * adapter (dose already encodes it); passed through by the Woo adapter.
   */
  variation?: { attribute: string; value: string }[] | undefined;
  image?: string | undefined;
  /** Quantity to add. Defaults to 1. */
  qty?: number | undefined;
}

/**
 * Adapter-canonical cart totals, in minor units.
 * `shipping: null` = not yet determinable (calculated at checkout);
 * `shipping: 0` = free shipping earned.
 */
export interface CartTotals {
  itemsSubtotal: number;
  discount: number;
  shipping: number | null;
  total: number;
  /** Decimal places of the currency (WC Store API convention). USD = 2. */
  currencyMinorUnit: number;
  appliedCoupons: string[];
}

/** Items + totals returned together by every adapter mutation. */
export interface CartSnapshot {
  items: CartItem[];
  totals: CartTotals;
}

// ---------------------------------------------------------------------------
// CartAdapter — the swappable backend seam
// ---------------------------------------------------------------------------

/**
 * Implement this interface to wire any commerce backend.
 *
 * Every method returns the AUTHORITATIVE snapshot (items + totals) after the
 * operation, so a WooCommerce adapter can return server-canonical state
 * instead of an optimistic local copy.
 */
export interface CartAdapter {
  /** Hydrate the cart from the backing store (localStorage, WC session, …). */
  load(): Promise<CartSnapshot>;

  /**
   * Add a product variant or increment its quantity if sku+dose already
   * exists. Returns the full snapshot after the mutation.
   */
  addItem(input: AddItemInput): Promise<CartSnapshot>;

  /** Remove a line by key. No-op if the key is not found. */
  removeItem(key: string): Promise<CartSnapshot>;

  /** Set an absolute quantity on a line. Removes the line when qty ≤ 0. */
  updateQty(key: string, qty: number): Promise<CartSnapshot>;

  /**
   * Apply a coupon code. Invalid codes reject with an Error whose message is
   * safe to surface in UI.
   */
  applyCoupon(code: string): Promise<CartSnapshot>;

  /** Remove a previously applied coupon. No-op if not applied. */
  removeCoupon(code: string): Promise<CartSnapshot>;

  /** Empty the cart (items and coupons). */
  clear(): Promise<CartSnapshot>;
}

// ---------------------------------------------------------------------------
// LocalStorageCartAdapter — prototype stub
// ---------------------------------------------------------------------------

const LS_ITEMS_KEY = "ptresearch__cart_v1";
const LS_COUPONS_KEY = "ptresearch__cart_coupons_v1";

const canUseStorage = typeof window !== "undefined";

const readJSON = <T,>(key: string, fallback: T): T => {
  if (!canUseStorage) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJSON = (key: string, value: unknown): void => {
  if (!canUseStorage) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage quota exceeded — state drifts until next reload; acceptable for stub.
  }
};

const readItems = (): CartItem[] => {
  const parsed = readJSON<unknown>(LS_ITEMS_KEY, []);
  return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
};

const readCoupons = (): string[] => {
  const parsed = readJSON<unknown>(LS_COUPONS_KEY, []);
  return Array.isArray(parsed) ? (parsed as string[]) : [];
};

/**
 * Local promo math — mirrors the live store's advertised offers:
 *   1. "Buy One Get One 50% Off — auto-applied at checkout": all units in the
 *      cart are sorted by price descending; every 2nd unit is discounted 50%.
 *   2. Coupon PT25 — 25% off the post-BOGO merchandise subtotal.
 *   3. Free shipping over $200 (post-discount); below the threshold shipping
 *      is null (calculated at checkout).
 *
 * PROTOTYPE-ONLY: the Woo adapter replaces all of this with server-canonical
 * totals. Constants come from brandConfig.promos.
 */
const computeLocalTotals = (
  items: CartItem[],
  appliedCoupons: string[]
): CartTotals => {
  const itemsSubtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  // BOGO 50%: expand lines into unit prices, sort desc, discount every 2nd unit.
  const units: number[] = [];
  for (const item of items) {
    for (let n = 0; n < item.qty; n += 1) units.push(item.price);
  }
  units.sort((a, b) => b - a);
  let bogoDiscount = 0;
  for (let n = 1; n < units.length; n += 2) {
    bogoDiscount += Math.floor((units[n] as number) / 2);
  }

  const couponPct = appliedCoupons.includes(brandConfig.promos.coupon.code)
    ? brandConfig.promos.coupon.percentOff
    : 0;
  const couponDiscount = Math.floor(
    ((itemsSubtotal - bogoDiscount) * couponPct) / 100
  );

  const discount = bogoDiscount + couponDiscount;
  const merchandise = itemsSubtotal - discount;

  const shipping: number | null =
    items.length > 0 && merchandise >= brandConfig.promos.freeShipping.thresholdMinor
      ? 0
      : null;

  return {
    itemsSubtotal,
    discount,
    shipping,
    total: merchandise + (shipping ?? 0),
    currencyMinorUnit: 2,
    appliedCoupons,
  };
};

const snapshot = (): CartSnapshot => {
  const items = readItems();
  const coupons = readCoupons();
  return { items, totals: computeLocalTotals(items, coupons) };
};

/**
 * Stubbed cart adapter backed by localStorage.
 *
 * All operations are synchronous under the hood; every method returns a
 * Promise so the interface matches an async server-side adapter. Replace by
 * passing a different CartAdapter to <CartProvider>.
 *
 * WooCommerce drop-in shape (for reference):
 *   class WooCommerceCartAdapter implements CartAdapter {
 *     async load() { return mapWcCart(await fetch('/wp-json/wc/store/v1/cart')) }
 *     async addItem(input) {
 *       // POST /wp-json/wc/store/v1/cart/add-item
 *       //   { id: input.variationId ?? input.productId, quantity: input.qty ?? 1,
 *       //     variation: input.variation }
 *     }
 *     // ... totals map 1:1 from the WC cart response (server-canonical).
 *   }
 */
export class LocalStorageCartAdapter implements CartAdapter {
  load(): Promise<CartSnapshot> {
    return Promise.resolve(snapshot());
  }

  addItem(input: AddItemInput): Promise<CartSnapshot> {
    const key = `${input.sku}__${input.dose}`;
    const incomingQty = input.qty ?? 1;
    const current = readItems();
    const existing = current.find((i) => i.key === key);
    const next: CartItem[] = existing
      ? current.map((i) =>
          i.key === key ? { ...i, qty: i.qty + incomingQty } : i
        )
      : [
          ...current,
          {
            key,
            sku: input.sku,
            dose: input.dose,
            name: input.name,
            price: input.price,
            qty: incomingQty,
            image: input.image,
            productId: input.productId,
            variationId: input.variationId,
          },
        ];
    writeJSON(LS_ITEMS_KEY, next);
    return Promise.resolve(snapshot());
  }

  removeItem(key: string): Promise<CartSnapshot> {
    const next = readItems().filter((i) => i.key !== key);
    writeJSON(LS_ITEMS_KEY, next);
    return Promise.resolve(snapshot());
  }

  updateQty(key: string, qty: number): Promise<CartSnapshot> {
    const current = readItems();
    const next: CartItem[] =
      qty <= 0
        ? current.filter((i) => i.key !== key)
        : current.map((i) => (i.key === key ? { ...i, qty } : i));
    writeJSON(LS_ITEMS_KEY, next);
    return Promise.resolve(snapshot());
  }

  applyCoupon(code: string): Promise<CartSnapshot> {
    const normalized = code.trim().toUpperCase();
    if (normalized !== brandConfig.promos.coupon.code) {
      return Promise.reject(
        new Error(`Code "${code}" is not valid.`)
      );
    }
    const coupons = readCoupons();
    if (!coupons.includes(normalized)) {
      writeJSON(LS_COUPONS_KEY, [...coupons, normalized]);
    }
    return Promise.resolve(snapshot());
  }

  removeCoupon(code: string): Promise<CartSnapshot> {
    const normalized = code.trim().toUpperCase();
    writeJSON(
      LS_COUPONS_KEY,
      readCoupons().filter((c) => c !== normalized)
    );
    return Promise.resolve(snapshot());
  }

  clear(): Promise<CartSnapshot> {
    writeJSON(LS_ITEMS_KEY, []);
    writeJSON(LS_COUPONS_KEY, []);
    return Promise.resolve(snapshot());
  }
}

// ---------------------------------------------------------------------------
// React context
// ---------------------------------------------------------------------------

const EMPTY_TOTALS: CartTotals = {
  itemsSubtotal: 0,
  discount: 0,
  shipping: null,
  total: 0,
  currencyMinorUnit: 2,
  appliedCoupons: [],
};

/** Value shape exposed through useCart() / useCartOptional(). */
export interface CartContextValue {
  items: CartItem[];
  /** Total quantity across all lines — drives cart badge counts. */
  count: number;
  /**
   * Sum of price × qty across all lines, in minor units (pre-discount).
   * Equals totals.itemsSubtotal — kept as a convenience.
   */
  subtotal: number;
  /** Adapter-canonical totals (see CartTotals). */
  totals: CartTotals;
  addItem(input: AddItemInput): Promise<void>;
  removeItem(key: string): Promise<void>;
  updateQty(key: string, qty: number): Promise<void>;
  /** Rejects with a UI-safe Error message when the code is invalid. */
  applyCoupon(code: string): Promise<void>;
  removeCoupon(code: string): Promise<void>;
  clear(): Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

/** Module-level singleton — avoids re-instantiating on every render. */
const defaultAdapter = new LocalStorageCartAdapter();

/**
 * Wraps a subtree with cart state. Mount once near the root.
 *
 * @param adapter  Defaults to LocalStorageCartAdapter (stub).
 *                 Pass a real adapter to connect WooCommerce.
 */
export function CartProvider({
  adapter,
  children,
}: {
  adapter?: CartAdapter;
  children: ReactNode;
}) {
  const [snap, setSnap] = useState<CartSnapshot>({
    items: [],
    totals: EMPTY_TOTALS,
  });

  // Keep the adapter current without triggering re-hydration on prop changes.
  // (Updated in an effect — mutating a ref during render violates
  // react-hooks/refs under the React 19 lint rules.)
  const adapterRef = useRef<CartAdapter>(adapter ?? defaultAdapter);
  useEffect(() => {
    adapterRef.current = adapter ?? defaultAdapter;
  }, [adapter]);

  // Hydrate from the backing store on mount.
  useEffect(() => {
    adapterRef.current
      .load()
      .then(setSnap)
      .catch(() => {
        // Hydration failed — start empty; the next mutation writes clean state.
      });
  }, []);

  const addItem = useCallback(async (input: AddItemInput): Promise<void> => {
    setSnap(await adapterRef.current.addItem(input));
  }, []);

  const removeItem = useCallback(async (key: string): Promise<void> => {
    setSnap(await adapterRef.current.removeItem(key));
  }, []);

  const updateQty = useCallback(
    async (key: string, qty: number): Promise<void> => {
      setSnap(await adapterRef.current.updateQty(key, qty));
    },
    []
  );

  const applyCoupon = useCallback(async (code: string): Promise<void> => {
    setSnap(await adapterRef.current.applyCoupon(code));
  }, []);

  const removeCoupon = useCallback(async (code: string): Promise<void> => {
    setSnap(await adapterRef.current.removeCoupon(code));
  }, []);

  const clear = useCallback(async (): Promise<void> => {
    setSnap(await adapterRef.current.clear());
  }, []);

  const count = useMemo(
    () => snap.items.reduce((sum, i) => sum + i.qty, 0),
    [snap.items]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items: snap.items,
      count,
      subtotal: snap.totals.itemsSubtotal,
      totals: snap.totals,
      addItem,
      removeItem,
      updateQty,
      applyCoupon,
      removeCoupon,
      clear,
    }),
    [
      snap,
      count,
      addItem,
      removeItem,
      updateQty,
      applyCoupon,
      removeCoupon,
      clear,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Access cart state and actions. Throws if called outside <CartProvider>.
 */
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart() must be called inside <CartProvider>.");
  }
  return ctx;
}

/**
 * Like useCart(), but returns null when called outside <CartProvider>.
 * Use in components that may render before CartProvider mounts (e.g. Nav).
 */
export function useCartOptional(): CartContextValue | null {
  return useContext(CartContext);
}
