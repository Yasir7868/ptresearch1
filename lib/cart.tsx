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
 * locally (the PT25 coupon and the free-shipping threshold — constants from
 * content/brand-config.ts). That IS correct for the prototype; the
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
import { cartPage } from "@/content/site-copy";
import { bulkCopy } from "@/content/bulk";
import { computeTotals, EMPTY_TOTALS as SHARED_EMPTY_TOTALS } from "@/lib/totals";

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

/**
 * One label/value pair carried on a cart line — WooCommerce's "cart item
 * data". The gift card fills it with the recipient, message and delivery date
 * the buyer entered (components/giftcard/GiftCardPanel.tsx); nothing else
 * uses it today. Labels come from content/site-copy.ts, never from a
 * component.
 */
export interface CartItemMeta {
  label: string;
  value: string;
}

/** A single cart line, uniquely keyed by `${sku}__${dose}` (+ meta digest). */
export interface CartItem {
  /** Stable identity — see `itemKey`. Used for all mutations. */
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
  /**
   * Per-line data entered at add-to-cart time (the gift card's recipient,
   * message and delivery date). Two lines that differ only here stay separate
   * — see `itemKey`.
   */
  meta?: CartItemMeta[] | undefined;
  /**
   * WooCommerce's `sold_individually`: the line is capped at one and its
   * quantity stepper is retired. True on gift cards.
   */
  soldIndividually?: boolean | undefined;
  /**
   * The line is not discountable — coupons skip it, though it still counts
   * toward the free-shipping threshold. True on gift cards: a card keeps its
   * full face value, so discounting one sells store credit below par.
   * WooCommerce expresses the same thing as a per-coupon product exclusion.
   */
  excludedFromCoupons?: boolean | undefined;
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
  /** Quantity to add. Defaults to 1; ignored when `soldIndividually`. */
  qty?: number | undefined;
  /** Per-line data to carry onto the line (see CartItemMeta). */
  meta?: CartItemMeta[] | undefined;
  /** Cap this line at one unit (WooCommerce `sold_individually`). */
  soldIndividually?: boolean | undefined;
  /** Keep coupons off this line (see CartItem.excludedFromCoupons). */
  excludedFromCoupons?: boolean | undefined;
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
  /**
   * Applied codes that are earning nothing because the order qualifies for
   * bulk pricing, which promo codes do not apply to. They stay in
   * `appliedCoupons` (the buyer entered them, and they count again if the
   * order drops back under the first rung) — this list is what lets the cart
   * explain the zero.
   */
  blockedCoupons: string[];
  /**
   * Discountable units in the cart — what the bulk ladder counts
   * (content/bulk.ts). Gift cards are excluded, as they are from the
   * discount base.
   */
  bulkUnits: number;
  /** The bulk tier this cart earned, or null below the first rung. */
  bulkTier: { code: string; percentOff: number } | null;
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

// ---------------------------------------------------------------------------
// Line identity
// ---------------------------------------------------------------------------

/** FNV-1a, base36 — short, stable, and no dependency. Not a security hash. */
const digest = (text: string): string => {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
};

/**
 * A line's stable identity.
 *
 * `${sku}__${dose}` for an ordinary product, so re-adding a variant
 * increments it. A line carrying per-line data (a gift card's recipient)
 * appends a digest of that data, so two $100 gift cards addressed to
 * different people are two lines — WooCommerce keys its own cart the same way.
 */
export function itemKey(input: {
  sku: string;
  dose: string;
  meta?: CartItemMeta[] | undefined;
}): string {
  const base = `${input.sku}__${input.dose}`;
  if (!input.meta || input.meta.length === 0) return base;
  return `${base}__${digest(input.meta.map((m) => `${m.label}=${m.value}`).join("|"))}`;
}

/**
 * Cart totals. The arithmetic lives in lib/totals.ts because the SERVER prices
 * orders with it too (lib/orders/price.ts) — the number the checkout quotes
 * and the number the customer is charged must come from one implementation.
 * This wrapper only narrows CartItem to the fields pricing depends on.
 */
const computeLocalTotals = (
  items: CartItem[],
  appliedCoupons: string[]
): CartTotals => computeTotals(items, appliedCoupons);

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
    const key = itemKey(input);
    // A sold-individually line never grows past one, however it is re-added.
    const incomingQty = input.soldIndividually ? 1 : (input.qty ?? 1);
    const current = readItems();
    const existing = current.find((i) => i.key === key);
    const next: CartItem[] = existing
      ? current.map((i) =>
          i.key === key
            ? { ...i, qty: input.soldIndividually ? 1 : i.qty + incomingQty }
            : i
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
            meta: input.meta,
            soldIndividually: input.soldIndividually,
            excludedFromCoupons: input.excludedFromCoupons,
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
        : current.map((i) =>
            // Removal still works on a sold-individually line; raising it does not.
            i.key === key ? { ...i, qty: i.soldIndividually ? 1 : qty } : i
          );
    writeJSON(LS_ITEMS_KEY, next);
    return Promise.resolve(snapshot());
  }

  applyCoupon(code: string): Promise<CartSnapshot> {
    const normalized = code.trim().toUpperCase();
    if (normalized !== brandConfig.promos.coupon.code) {
      return Promise.reject(new Error(cartPage.couponNotFound(code.trim())));
    }
    // Promo codes do not apply to bulk orders — say so at entry rather than
    // accepting the code and quietly discounting nothing.
    const { bulkUnits, bulkTier } = snapshot().totals;
    if (bulkTier) {
      return Promise.reject(
        new Error(bulkCopy.cart.couponBlocked(normalized, bulkUnits))
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

const EMPTY_TOTALS: CartTotals = SHARED_EMPTY_TOTALS;

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
