"use client";

/**
 * BuyPanel — the PDP's one interactive island: size selector (variable
 * products), qty stepper, live price line, and the Add to Cart action wired
 * to useCart(). Receives a serialized subset of the Product model from the
 * RSC page.
 *
 * D3 presentation notes:
 *  - The size selector is a soft segmented tab row (10px radius — DESIGN §4
 *    soft scale) — Radix RadioGroup semantics kept, radio dot visually
 *    hidden, selected tab fills brand navy.
 *  - GRAFT #12: switching sizes crossfades the tabular price (~200ms,
 *    AnimatePresence popLayout). Reduced motion: instant swap.
 *  - Add to Cart keeps the EXACT useCart wiring + drawer-open event — the
 *    functional layer is done and must keep working.
 *
 * Money: integer minor units in, formatMinor out, always rendered .data-num.
 * OOS / non-purchasable products render a disabled state with a muted note.
 */

import { useEffect, useRef, useState } from "react";
import { MinusIcon, PlusIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { requestCartDrawerOpen } from "@/components/cart/drawer-events";
import { REFERENCE_EASE } from "@/components/motion/InkWipe";
import { useCart } from "@/lib/cart";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { formatMinor } from "./money";

/** Serialized subset of Product that the buy panel needs. */
export interface BuyPanelProduct {
  productId: number;
  sku: string;
  slug: string;
  displayName: string;
  kind: "simple" | "variable";
  priceMinor: number;
  currencyMinorUnit: number;
  variations?: { variationId: number; size: string; priceMinor: number }[];
  isInStock: boolean;
  isPurchasable: boolean;
  /** Primary image src — carried onto the cart line for the drawer thumb. */
  image?: string;
}

const MAX_QTY = 99;

export function BuyPanel({ product }: { product: BuyPanelProduct }) {
  const { addItem } = useCart();
  const reduced = useReducedMotion();

  const variations = product.variations ?? [];
  const hasSizes = product.kind === "variable" && variations.length > 0;

  const [size, setSize] = useState<string>(variations[0]?.size ?? "");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    track("product_viewed", { sku: product.sku, slug: product.slug });
  }, [product.sku, product.slug]);

  useEffect(() => {
    return () => {
      if (addedTimer.current) clearTimeout(addedTimer.current);
    };
  }, []);

  const selected = hasSizes
    ? (variations.find((v) => v.size === size) ?? variations[0])
    : undefined;
  const unitPriceMinor = selected?.priceMinor ?? product.priceMinor;
  const unavailable = !product.isPurchasable || !product.isInStock;

  const stepQty = (delta: number) =>
    setQty((q) => Math.min(MAX_QTY, Math.max(1, q + delta)));

  const handleAdd = async () => {
    await addItem({
      sku: product.sku,
      dose: selected?.size ?? "",
      name: product.displayName,
      price: unitPriceMinor,
      productId: product.productId,
      variationId: selected?.variationId,
      variation: selected
        ? [{ attribute: "Size", value: selected.size }]
        : undefined,
      image: product.image,
      qty,
    });
    track("add_to_cart", {
      sku: product.sku,
      dose: selected?.size ?? "",
      qty,
      price_cents: unitPriceMinor,
    });
    setAdded(true);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(false), 2000);
    // Surface the result immediately — open the cart drawer.
    requestCartDrawerOpen();
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Size selector — soft segmented tabs (the 3 variable products) */}
      {hasSizes && (
        <fieldset>
          <legend className="micro-label mb-2.5">Size</legend>
          <RadioGroup
            value={selected?.size ?? ""}
            onValueChange={setSize}
            aria-label="Size"
            className="flex w-auto flex-wrap gap-2"
          >
            {variations.map((v) => (
              <label
                key={v.variationId}
                className={cn(
                  "flex cursor-pointer flex-col gap-0.5 rounded-lg border border-hairline bg-surface px-4 py-2.5 text-ink transition-colors",
                  "hover:border-ink-muted",
                  // Selected tab fills bottle-green; children inherit the
                  // light text via currentColor (price dims with opacity).
                  "has-data-checked:border-green has-data-checked:bg-green has-data-checked:text-surface",
                  // The radio itself is sr-only — surface keyboard focus on the tab.
                  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-green"
                )}
              >
                <RadioGroupItem value={v.size} className="sr-only" />
                <span className="data-num text-sm leading-tight">{v.size}</span>
                <span className="data-num text-xs leading-tight opacity-75">
                  {formatMinor(v.priceMinor, product.currencyMinorUnit)}
                </span>
              </label>
            ))}
          </RadioGroup>
        </fieldset>
      )}

      {/* Stock status + price line — price sits BELOW the trust block, by
          design (purity resolves above price, DESIGN §8). */}
      <div className="flex flex-col gap-1.5">
        {product.isInStock ? (
          <span className="micro-label inline-flex items-center gap-1.5 !text-ok">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-ok" />
            In stock
          </span>
        ) : (
          <span className="micro-label">Out of stock</span>
        )}

        {/* GRAFT #12 — ~200ms tabular price crossfade on size switch. */}
        <div aria-live="polite" className="relative">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.p
              key={unitPriceMinor}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: reduced ? 0 : 0.2,
                ease: REFERENCE_EASE,
              }}
              className="data-num text-[2rem] leading-none tracking-tight text-ink"
            >
              {formatMinor(unitPriceMinor, product.currencyMinorUnit)}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Qty + add to cart */}
      <div className="flex items-stretch gap-3">
        <div
          role="group"
          aria-label="Quantity"
          className="flex items-center rounded-lg border border-hairline bg-surface"
        >
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={unavailable || qty <= 1}
            className="flex h-11 w-9 items-center justify-center text-ink-muted transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-40"
            onClick={() => stepQty(-1)}
          >
            <MinusIcon className="size-3.5" />
          </button>
          <span
            aria-live="polite"
            className="data-num w-8 text-center text-sm text-ink"
          >
            {qty}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={unavailable || qty >= MAX_QTY}
            className="flex h-11 w-9 items-center justify-center text-ink-muted transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-40"
            onClick={() => stepQty(1)}
          >
            <PlusIcon className="size-3.5" />
          </button>
        </div>

        <Button
          type="button"
          disabled={unavailable}
          onClick={() => void handleAdd()}
          className="h-11 flex-1 text-[15px]"
        >
          {added ? "Added to cart" : "Add to cart"}
        </Button>
      </div>

      {/* Screen-reader confirmation */}
      <span aria-live="polite" className="sr-only">
        {added ? `${product.displayName} added to cart` : ""}
      </span>

      {unavailable && (
        <p className="text-sm text-ink-muted">
          Currently unavailable. Check back, or contact us about restock
          timing.
        </p>
      )}
    </div>
  );
}
