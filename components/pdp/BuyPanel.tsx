"use client";

/**
 * BuyPanel — the live product template's buy zone, plus its sticky
 * add-to-cart bar. Both share one state, so the dosage and quantity always
 * match (the live page syncs its two forms with script).
 *
 *   Dosage   a white card of navy pills: the one size of a simple product, or
 *            every size of a variable product. Variable products start with no
 *            size picked, as live: the price shows the range, the caption is
 *            empty and Add to cart is dimmed (pressing it shows WooCommerce's
 *            "Please select some product options…" alert).
 *   Price    "Order Now, Ships Today" / "One-time purchase", then the price
 *            (struck list price + sale price when discounted) and the picked
 *            size underneath.
 *   Buy      a round quantity stepper and the navy Add to cart; stacked under
 *            450px. Adding opens the cart drawer.
 *   Sticky   fixed to the bottom of the screen: name + size, pills, price,
 *            quantity and Add to cart. Desktop shows it after 500px of scroll;
 *            under 550px wide it shows once the page has been scrolled, except
 *            while the price box is on screen (the live page's own rules).
 *
 * Live, every pill looks the same, picked or not; here a picked pill on a
 * multi-size product gets a thin ring so the selection is visible.
 */

import { useEffect, useId, useRef, useState } from "react";
import { MinusIcon, PlusIcon } from "lucide-react";
import { requestCartDrawerOpen } from "@/components/cart/drawer-events";
import { useCart } from "@/lib/cart";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { productPage } from "@/content/site-copy";
import { LivePrice, priceView } from "./LivePrice";
import { NAVY_BUTTON, PILL } from "./live-style";

/** Serialized subset of Product that the buy panel needs. */
export interface BuyPanelProduct {
  productId: number;
  sku: string;
  slug: string;
  displayName: string;
  kind: "simple" | "variable";
  priceMinor: number;
  regularPriceMinor: number;
  currencyMinorUnit: number;
  /** A simple product's size, e.g. "80mg". */
  size?: string;
  variations?: {
    variationId: number;
    size: string;
    priceMinor: number;
    regularPriceMinor: number;
  }[];
  isInStock: boolean;
  isPurchasable: boolean;
  /** Primary image src — carried onto the cart line for the drawer thumb. */
  image?: string;
}

const MAX_QTY = 99;
/** Live: the desktop sticky bar appears past this scroll depth. */
const STICKY_SCROLL_PX = 500;
/** Live: below this viewport width the sticky bar follows the price box. */
const STICKY_MOBILE_PX = 550;

// ---------------------------------------------------------------------------
// Quantity stepper
// ---------------------------------------------------------------------------

function QtyStepper({
  value,
  onChange,
  onCommit,
  disabled,
  className,
  inputClassName,
}: {
  value: string;
  onChange: (value: string) => void;
  onCommit: () => void;
  disabled: boolean;
  className?: string;
  inputClassName?: string;
}) {
  const current = Number.parseInt(value, 10) || 1;
  const step = (delta: number) =>
    onChange(String(Math.min(MAX_QTY, Math.max(1, current + delta))));

  return (
    <div
      className={cn(
        "flex h-[54px] items-center overflow-hidden rounded-full border border-[#d6d7e3]",
        className
      )}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={disabled || current <= 1}
        onClick={() => step(-1)}
        className="flex h-full w-[34px] shrink-0 cursor-pointer items-center justify-center text-[#292e4c] disabled:cursor-default"
      >
        <MinusIcon className="size-3" strokeWidth={3.5} />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={MAX_QTY}
        step={1}
        aria-label="Product quantity"
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onCommit}
        className={cn(
          "h-[52px] w-[54px] min-w-0 bg-white text-center text-[15px] font-bold text-[#14214d] outline-none [appearance:textfield] focus-visible:bg-[#f5f6fa] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          inputClassName
        )}
      />
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disabled || current >= MAX_QTY}
        onClick={() => step(1)}
        className="flex h-full w-[34px] shrink-0 cursor-pointer items-center justify-center text-[#292e4c] disabled:cursor-default"
      >
        <PlusIcon className="size-3" strokeWidth={3.5} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The panel
// ---------------------------------------------------------------------------

export function BuyPanel({ product }: { product: BuyPanelProduct }) {
  const { addItem } = useCart();
  const labelId = useId();
  const priceBoxRef = useRef<HTMLDivElement>(null);

  const variations = product.variations ?? [];
  const hasSizes = product.kind === "variable" && variations.length > 0;

  const [size, setSize] = useState<string | null>(null);
  const [qtyInput, setQtyInput] = useState("1");
  const [stickyVisible, setStickyVisible] = useState(false);

  useEffect(() => {
    track("product_viewed", { sku: product.sku, slug: product.slug });
  }, [product.sku, product.slug]);

  // The live sticky bar's show/hide rules (see header).
  useEffect(() => {
    let hasScrolled = false;
    const update = () => {
      const y = window.scrollY;
      if (window.innerWidth >= STICKY_MOBILE_PX) {
        setStickyVisible(y > STICKY_SCROLL_PX);
        return;
      }
      if (y > 0) hasScrolled = true;
      const r = priceBoxRef.current?.getBoundingClientRect();
      const priceBoxOnScreen = Boolean(r && r.top <= window.innerHeight && r.bottom >= 0);
      setStickyVisible(hasScrolled && !priceBoxOnScreen);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const selected = hasSizes ? variations.find((v) => v.size === size) : undefined;
  const needsSize = hasSizes && !selected;
  const unavailable = !product.isPurchasable || !product.isInStock;
  const qty = Math.min(MAX_QTY, Math.max(1, Number.parseInt(qtyInput, 10) || 1));
  const view = priceView(product, selected);

  // Under the price: the picked size, upper-cased as the live script prints it
  // ("10 ml" → "10 ML"); a simple product shows its one size as-is.
  const caption = hasSizes
    ? (selected?.size.replace("-", " ").toUpperCase() ?? "")
    : (product.size ?? "");

  const pills = hasSizes
    ? variations.map((v) => ({ key: v.variationId, label: v.size, active: v.size === size }))
    : product.size
      ? [{ key: product.productId, label: product.size, active: true }]
      : [];

  const handleAdd = async () => {
    if (unavailable) return;
    if (needsSize) {
      window.alert(productPage.selectOptionsAlert);
      return;
    }
    const unitPriceMinor = selected?.priceMinor ?? product.priceMinor;
    await addItem({
      sku: product.sku,
      dose: selected?.size ?? "",
      name: product.displayName,
      price: unitPriceMinor,
      productId: product.productId,
      variationId: selected?.variationId,
      variation: selected ? [{ attribute: "Size", value: selected.size }] : undefined,
      image: product.image,
      qty,
    });
    track("add_to_cart", {
      sku: product.sku,
      dose: selected?.size ?? "",
      qty,
      price_cents: unitPriceMinor,
    });
    requestCartDrawerOpen();
  };

  const renderPills = (compact: boolean) =>
    pills.map((p) => (
      <button
        key={p.key}
        type="button"
        aria-pressed={p.active}
        onClick={() => hasSizes && setSize(p.label)}
        className={cn(
          PILL,
          "text-[13px] leading-normal",
          compact ? "px-2.5 py-[5px]" : "px-4 py-2",
          hasSizes && p.active && "ring-2 ring-[#14214d]/35 ring-offset-2 ring-offset-white"
        )}
      >
        {p.label}
      </button>
    ));

  const addButton = (className: string) => (
    <button
      type="button"
      disabled={unavailable}
      aria-disabled={needsSize || undefined}
      onClick={() => void handleAdd()}
      className={cn(
        NAVY_BUTTON,
        "text-base leading-none",
        (unavailable || needsSize) && "opacity-50 hover:bg-[#14214d]",
        unavailable && "cursor-not-allowed",
        className
      )}
    >
      {unavailable ? productPage.outOfStockButton : productPage.addToCart}
    </button>
  );

  const stepper = (className?: string, inputClassName?: string) => (
    <QtyStepper
      value={qtyInput}
      onChange={setQtyInput}
      onCommit={() => setQtyInput(String(qty))}
      disabled={unavailable}
      className={className}
      inputClassName={inputClassName}
    />
  );

  return (
    <>
      {pills.length > 0 ? (
        <div className="rounded-xl border border-[#d6d7e3] bg-white px-2.5 pt-2 pb-2.5">
          <p
            id={labelId}
            className="mb-1.5 text-[11px] leading-normal font-bold tracking-[0.04em] text-[rgba(41,46,76,0.52)] uppercase"
          >
            {productPage.dosageLabel}
          </p>
          <div role="group" aria-labelledby={labelId} className="flex flex-wrap gap-2.5">
            {renderPills(false)}
          </div>
        </div>
      ) : null}

      <div
        ref={priceBoxRef}
        className="rounded-2xl border border-[rgba(41,46,76,0.08)] bg-[#f5f6fa] px-3.5 pt-3 pb-[15px]"
      >
        <div className="flex justify-between gap-3 font-roboto text-[11px] leading-normal font-medium text-[rgba(41,46,76,0.55)]">
          <p>{productPage.shipsToday}</p>
          <p>{productPage.purchaseType}</p>
        </div>
        <div aria-live="polite">
          <LivePrice
            view={view}
            className="font-roboto text-4xl leading-[1.5] font-bold text-[#292e4c]"
            delClassName="opacity-70"
          />
        </div>
        <p className="mt-1.5 min-h-[15px] text-[11px] leading-[1.4] font-semibold text-[rgba(41,46,76,0.45)]">
          {caption}
        </p>
      </div>

      <div className="flex items-center gap-5 max-[450px]:flex-col max-[450px]:gap-2.5">
        {stepper("max-[450px]:w-[300px] max-[450px]:max-w-full", "max-[450px]:flex-1")}
        {addButton("h-[52px] px-4")}
      </div>

      {/* Sticky add-to-cart bar */}
      <div
        aria-hidden={!stickyVisible}
        inert={!stickyVisible}
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-[3px] border-[#d6d7e3] bg-white p-2.5 transition-all duration-300 ease-in-out motion-reduce:transition-none",
          stickyVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        )}
      >
        <div className="flex items-center justify-center gap-5 max-md:flex-col max-md:items-start max-md:gap-2.5">
          <div className="flex w-1/5 flex-col items-center gap-[5px] text-center max-md:w-full max-md:items-start max-md:text-left">
            <p className="font-roboto text-[13px] leading-none font-semibold text-[#14214d]">
              {product.displayName}
            </p>
            <p className="min-h-[15px] text-[11px] leading-[1.4] font-semibold text-[rgba(41,46,76,0.45)]">
              {caption}
            </p>
          </div>
          {pills.length > 0 ? (
            <div
              role="group"
              aria-label={productPage.dosageLabel}
              className="flex flex-wrap gap-2.5 max-md:order-first"
            >
              {renderPills(true)}
            </div>
          ) : null}
          <LivePrice
            view={view}
            className="font-roboto text-xl leading-[1.5] text-[#017eff]"
            delClassName="font-extrabold opacity-70"
            insClassName="font-bold"
          />
          <div className="flex items-center gap-5">
            {stepper()}
            {addButton("h-12 w-[180px]")}
          </div>
        </div>
      </div>
    </>
  );
}
