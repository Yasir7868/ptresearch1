"use client";

/**
 * BestSellers — "Most ordered this month": 4-up product cards on the mist
 * ground. Each card: the vial on a frost field (corner badge + COA chip), a
 * "category · size" line, the name and a one-line descriptor, price with the
 * struck list price, stock, and Add to cart (Select size for variable
 * products, which links to the PDP). Adding shows the design's bottom toast.
 *
 * Trust rules (hard):
 *   - The "COA ✓" chip renders only where a real certificate exists
 *     (`coaUrl`), like the catalog's earned VerifiedMark.
 *   - Prices, list prices and discounts are WooCommerce's own (priceLine);
 *     "SAVE n%" is drawn from them, never invented.
 *   - Names are the mapper's coded display names (GLP rule).
 *
 * Client component: add-to-cart talks to useCart(). The whole card is one
 * link to the PDP (stretched from the title); the button sits above it.
 */

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/woo/types";
import { redesignHome } from "@/content/site-copy";
import { useCart } from "@/lib/cart";
import { track } from "@/lib/analytics";
import { formatMinor, priceLine } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CONTAINER, Kicker, SERIF } from "./parts";

const copy = redesignHome.bestSellers;

/** How long the "added to cart" toast stays up (the design's 2.2s). */
const TOAST_MS = 2200;

/** A discount at least this deep earns a "SAVE n%" badge. */
const SAVE_BADGE_MIN_PERCENT = 25;

/**
 * Frame the vial exactly as the design's cut-outs (360x590) do. Measured
 * against the store's 1024x1536 studio template (components/plate/
 * vial-crop.ts), every cut-out is the same window of the photograph: 57.8%
 * of its height, centred at 51.1%, 360:590 wide. In a 360:590 box an
 * object-cover image shows the whole height, so scale = 1 / 0.578 and the
 * -1.1% shift re-centres the window (.plate-zoom applies both).
 */
const VIAL_FRAME = {
  "--plate-zoom": 1.73,
  "--plate-zoom-y": "-1.1%",
} as CSSProperties;

/** "Glow Blend (BPC-157 TB-500 GHK-CU )" → title + component list. */
function splitName(product: Product): { title: string; subtitle?: string } {
  const match = product.displayName.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
  const tokens = match?.[2].trim().split(/\s+/) ?? [];
  // Only a list of compound codes is lifted out ("(USP Grade)" stays put).
  const isComponentList =
    tokens.length > 1 && tokens.every((t) => /^[A-Z0-9][A-Z0-9-]*$/.test(t));
  const title = match && isComponentList ? match[1] : product.displayName;
  const subtitle =
    copy.subtitles[product.slug] ??
    (isComponentList ? tokens.join(" · ") : undefined);
  return { title, subtitle };
}

/** ["10mg", "20mg", "60mg"] → "10–60mg". */
function sizeRange(sizes: string[]): string | undefined {
  if (sizes.length <= 1) return sizes[0];
  const parsed = sizes.map((s) => s.match(/^([\d.]+)\s*([a-zµ]+)$/i));
  const unit = parsed[0]?.[2];
  if (unit && parsed.every((m) => m && m[2].toLowerCase() === unit.toLowerCase())) {
    const values = parsed.map((m) => parseFloat(m![1]));
    return `${Math.min(...values)}–${Math.max(...values)}${unit}`;
  }
  return sizes.join(" / ");
}

function BestSellerCard({
  product,
  onAdded,
}: {
  product: Product;
  onAdded: (message: string) => void;
}) {
  const { addItem } = useCart();
  const image = product.images[0];
  const { title, subtitle } = splitName(product);
  const variable = product.kind === "variable";
  const size = variable
    ? sizeRange((product.variations ?? []).map((v) => v.size).filter(Boolean))
    : product.size;
  const { price, regular, percentOff } = priceLine(product);
  const badge =
    copy.badges[product.slug] ??
    (percentOff !== null && percentOff >= SAVE_BADGE_MIN_PERCENT
      ? copy.save(percentOff)
      : undefined);
  const outOfStock = !product.isInStock;
  const unavailable = outOfStock || !product.isPurchasable;
  const href = `/product/${product.slug}`;

  const handleAdd = async () => {
    await addItem({
      sku: product.sku,
      dose: "",
      name: product.displayName,
      price: product.priceMinor,
      productId: product.productId,
      image: image?.src,
      qty: 1,
    });
    track("add_to_cart", {
      sku: product.sku,
      dose: "",
      qty: 1,
      price_cents: product.priceMinor,
    });
    onAdded(copy.added(size ? `${title} ${size}` : title));
  };

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-xl border border-rule bg-white transition-[border-color,box-shadow] duration-200 hover:border-cobalt hover:shadow-[0_10px_30px_rgba(11,27,51,.08)] has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-cobalt">
      <div className="relative bg-frost p-[18px]">
        <div className="relative aspect-[360/590] overflow-hidden bg-white">
          {image ? (
            <Image
              src={image.src}
              alt={image.alt || title}
              fill
              // The frame scales the photograph ~1.9x the box width.
              sizes="(min-width: 1240px) 500px, (min-width: 768px) 90vw, 180vw"
              className={cn(
                "plate-zoom object-cover",
                outOfStock && "opacity-45"
              )}
              style={VIAL_FRAME}
            />
          ) : null}
        </div>
        {badge ? (
          <span className="absolute top-3 left-3 rounded-xs bg-navy px-[9px] py-[5px] text-[11px] font-extrabold tracking-[0.08em] text-white">
            {badge}
          </span>
        ) : null}
        {product.coaUrl ? (
          <span className="absolute top-3 right-3 rounded-xs border border-rule bg-white px-2 py-[5px] text-[11px] font-bold text-navy">
            {copy.coaChip} <span aria-hidden="true">✓</span>
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div>
          <p className="text-[12px] font-semibold text-steel">
            {[product.categoryName, size].filter(Boolean).join(" · ")}
          </p>
          <h3 className="mt-1 text-[17px] leading-[1.25] font-extrabold text-pretty text-navy-ink">
            <Link
              href={href}
              className="text-navy-ink after:absolute after:inset-0 after:content-[''] hover:text-navy-ink focus-visible:outline-none"
            >
              {title}
            </Link>
          </h3>
          {subtitle ? (
            <p className="mt-1 text-[13px] text-steel">{subtitle}</p>
          ) : null}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2">
          <p className="flex items-baseline gap-2">
            <span className="text-[20px] font-extrabold text-navy-ink tabular-nums">
              {variable
                ? `${copy.fromPrefix} ${formatMinor(product.priceMinor, product.currencyMinorUnit)}`
                : price}
            </span>
            {regular && !variable ? (
              <s className="text-[14px] text-steel tabular-nums">{regular}</s>
            ) : null}
          </p>
          <span
            className={cn(
              "text-[12px] font-bold",
              outOfStock ? "text-steel" : "text-ok"
            )}
          >
            {outOfStock ? copy.outOfStock : copy.inStock}
          </span>
        </div>

        {unavailable ? (
          <button
            type="button"
            disabled
            className="relative z-10 h-[46px] rounded-lg bg-rule text-[15px] font-bold text-steel"
          >
            {copy.outOfStock}
          </button>
        ) : variable ? (
          <Link
            href={href}
            className="relative z-10 flex h-[46px] items-center justify-center rounded-lg bg-cobalt text-[15px] font-bold text-white transition-colors hover:bg-cobalt-bright hover:text-white"
          >
            {copy.selectSize}
            <span className="sr-only"> — {title}</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => void handleAdd()}
            className="relative z-10 h-[46px] cursor-pointer rounded-lg bg-cobalt text-[15px] font-bold text-white transition-colors hover:bg-cobalt-bright"
          >
            {copy.addToCart}
            <span className="sr-only"> — {title}</span>
          </button>
        )}
      </div>
    </article>
  );
}

export function BestSellers({ products }: { products: Product[] }) {
  const [toast, setToast] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const showToast = (message: string) => {
    setToast(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), TOAST_MS);
  };

  return (
    <section className={cn(CONTAINER, "pt-10 pb-14")}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Kicker>{copy.eyebrow}</Kicker>
          <h2
            className={cn(
              SERIF,
              "mt-1.5 text-[clamp(26px,3.5vw,36px)] tracking-[-0.01em] text-navy-ink"
            )}
          >
            {copy.heading}
          </h2>
        </div>
        <p className="text-[14px] text-steel">{copy.note}</p>
      </div>

      <ul className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4">
        {products.map((product) => (
          <li key={product.productId}>
            <BestSellerCard product={product} onAdded={showToast} />
          </li>
        ))}
      </ul>

      {/* The design's cart toast — also the screen-reader announcement. */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
      >
        {toast ? (
          <p className="rounded-[12px] bg-navy-ink px-[18px] py-3 text-[14px] font-bold whitespace-nowrap text-white shadow-[0_12px_32px_rgba(0,0,0,.25)]">
            {toast}
          </p>
        ) : null}
      </div>
    </section>
  );
}
