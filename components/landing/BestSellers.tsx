"use client";

/**
 * BestSellers — "Most ordered this month": 4-up product cards on the mist
 * ground (two-up on phones). Each card: the vial on a frost field (corner
 * badge + COA chip), a size line (no category name — owner request
 * 2026-09-27), the name and a one-line descriptor, price with the
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
import { Arrow, CONTAINER, Kicker, SERIF } from "./parts";

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
      <div className="relative bg-frost p-2.5 sm:p-[18px]">
        <div className="relative aspect-[360/590] overflow-hidden bg-white">
          {image ? (
            <Image
              src={image.src}
              alt={image.alt || title}
              fill
              // The frame scales the photograph ~1.9x the box width.
              sizes="(min-width: 1240px) 500px, 90vw"
              className={cn(
                "plate-zoom object-cover",
                outOfStock && "opacity-45"
              )}
              style={VIAL_FRAME}
            />
          ) : null}
        </div>
        {/* Two-up cards are ~165px wide on a phone, which is not enough for
            "BEST SELLER" and the COA chip to share the top row — they
            collided. On phones the promo badge drops to the bottom of the
            image (empty sweep under the vial) and the earned COA mark keeps
            the top corner; from md both sit along the top, as designed. */}
        {badge ? (
          <span className="absolute bottom-2.5 left-2.5 rounded-xs bg-navy px-2 py-1 text-[10px] font-extrabold tracking-[0.06em] text-white md:top-3 md:bottom-auto md:left-3 md:px-[9px] md:py-[5px] md:text-[11px] md:tracking-[0.08em]">
            {badge}
          </span>
        ) : null}
        {product.coaUrl ? (
          <span className="absolute top-2.5 right-2.5 rounded-xs border border-rule bg-white px-1.5 py-1 text-[10px] font-bold text-navy md:top-3 md:right-3 md:px-2 md:py-[5px] md:text-[11px]">
            {copy.coaChip} <span aria-hidden="true">✓</span>
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-3 sm:p-4">
        <div>
          {size ? (
            <p className="mb-1 text-[12px] font-semibold text-steel">{size}</p>
          ) : null}
          <h3 className="text-[15px] leading-[1.25] sm:text-[17px] font-extrabold text-pretty text-navy-ink">
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

        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-[17px] font-extrabold sm:text-[20px] text-navy-ink tabular-nums">
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
        {/* The homepage's route into the catalog now that the category grid
            is gone — outlined, so it does not compete with the cobalt Add to
            cart buttons in the grid below. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="text-[14px] text-steel">{copy.note}</p>
          <Link
            href="/catalog"
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-rule bg-white px-4 text-[14px] font-bold whitespace-nowrap text-navy transition-colors hover:border-cobalt hover:text-navy"
          >
            {copy.browseAll} <Arrow />
          </Link>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-[repeat(auto-fill,minmax(230px,1fr))]">
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
