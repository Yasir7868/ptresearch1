"use client";

/**
 * RelatedCarousel — the live "Related Products" loop carousel: four cards per
 * view on desktop, two on tablet (≤1024px), one on phones (≤767px), 10px
 * apart; loops forever, slides every 5 s (paused while hovered, stopped for
 * good once the visitor uses the arrows, dots or a swipe), 500ms slides, faint
 * chevron arrows inside and dots below.
 *
 * Cards: the vial image zoomed 1.6× in a clipped frame, name, price, and a
 * navy button — Add to cart for an in-stock simple product (adds one and
 * opens the cart drawer), otherwise "Select options" / "Read more" linking to
 * the product. The live button's cart emoji is a line icon here (no emoji,
 * PRODUCT.md).
 *
 * Cards per view is CSS (the --per-view custom property), so the server HTML
 * is already laid out for every breakpoint; the track keeps CLONES copies on
 * each side so a loop step never shows a gap.
 */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon, ShoppingCartIcon } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { requestCartDrawerOpen } from "@/components/cart/drawer-events";
import { useCart } from "@/lib/cart";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { catalogPage } from "@/content/site-copy";
import { LivePrice, priceView, type PricedItem } from "./LivePrice";
import { NAVY_BUTTON } from "./live-style";

export interface RelatedItem extends PricedItem {
  productId: number;
  sku: string;
  slug: string;
  name: string;
  image?: { src: string; alt: string };
  kind: "simple" | "variable";
  /** Purchasable and in stock. */
  available: boolean;
  onSale: boolean;
}

const GAP_PX = 10;
/** Clones on each side — the most cards ever in view. */
const CLONES = 4;
const SPEED_MS = 500;
const AUTOPLAY_MS = 5000;
const SWIPE_PX = 50;

const mod = (n: number, m: number) => ((n % m) + m) % m;

function RelatedCard({ item }: { item: RelatedItem }) {
  const { addItem } = useCart();
  const href = `/product/${item.slug}`;
  const buttonClass = cn(
    NAVY_BUTTON,
    "relative shrink-0 py-3 pr-10 pl-5 font-roboto text-sm leading-none md:py-[13px] md:text-base"
  );
  const cartIcon = (
    <ShoppingCartIcon aria-hidden="true" className="absolute right-3 size-[18px]" strokeWidth={2.25} />
  );

  const handleAdd = async () => {
    await addItem({
      sku: item.sku,
      dose: "",
      name: item.name,
      price: item.priceMinor,
      productId: item.productId,
      image: item.image?.src,
    });
    track("add_to_cart", { sku: item.sku, dose: "", qty: 1, price_cents: item.priceMinor });
    requestCartDrawerOpen();
  };

  return (
    <div className="relative flex h-full flex-col justify-between gap-5 rounded-[10px] border border-[#dadada] bg-white p-2 md:p-2.5">
      {item.onSale ? (
        <span className="absolute top-[13px] left-[11px] z-10 bg-[#2c4d82] px-5 py-[3px] text-[10px] leading-[15px] text-white uppercase">
          {catalogPage.saleBadge}
        </span>
      ) : null}

      <Link
        href={href}
        tabIndex={-1}
        aria-hidden="true"
        draggable={false}
        className="block h-[230px] overflow-hidden md:h-[300px]"
      >
        {item.image ? (
          <Image
            src={item.image.src}
            alt=""
            width={512}
            height={768}
            draggable={false}
            sizes="(min-width: 1025px) 25vw, (min-width: 768px) 48vw, 92vw"
            className="block h-[280px] w-full scale-[1.6] object-contain md:h-[360px]"
          />
        ) : null}
      </Link>

      <h3 className="font-roboto text-sm leading-[1.1] font-semibold text-[#1b3358] max-md:text-center md:text-lg">
        <Link href={href} draggable={false} className="hover:underline">
          {item.name}
        </Link>
      </h3>

      <div className="flex items-center justify-between gap-3 max-md:justify-center">
        <LivePrice
          view={priceView(item)}
          className="font-roboto text-[15px] leading-[1.1] font-bold text-[#2c4d82]"
        />
        {item.available && item.kind === "simple" ? (
          <button type="button" onClick={() => void handleAdd()} className={buttonClass}>
            {catalogPage.addToCart}
            {cartIcon}
          </button>
        ) : (
          <Link href={href} draggable={false} className={buttonClass}>
            {item.available ? catalogPage.selectOptions : catalogPage.readMore}
            {cartIcon}
          </Link>
        )}
      </div>
    </div>
  );
}

export function RelatedCarousel({ items, label }: { items: RelatedItem[]; label: string }) {
  const n = items.length;
  const looping = n > 1;
  const reduced = useReducedMotion();

  // Slides = CLONES copies of the tail, the items, CLONES copies of the head.
  const slides = looping
    ? [
        ...Array.from({ length: CLONES }, (_, k) => items[mod(k - CLONES, n)]),
        ...items,
        ...Array.from({ length: CLONES }, (_, k) => items[mod(k, n)]),
      ]
    : items;
  const offset = looping ? CLONES : 0;

  const [pos, setPos] = useState(offset);
  const [animate, setAnimate] = useState(true);
  const [dragPx, setDragPx] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [stopped, setStopped] = useState(false);
  const moving = useRef(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drag = useRef<{ x: number; captured: boolean } | null>(null);
  const suppressClick = useRef(false);

  const active = looping ? mod(pos - offset, n) : 0;

  // After a slide lands on a clone, jump (without animating) to the real card.
  const settle = () => {
    moving.current = false;
    setAnimate(false);
    setPos((p) => offset + mod(p - offset, n));
  };

  const goTo = (target: number) => {
    if (!looping || moving.current || target === pos) return;
    if (reduced) {
      setAnimate(false);
      setPos(offset + mod(target - offset, n));
      return;
    }
    moving.current = true;
    setAnimate(true);
    setPos(target);
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(settle, SPEED_MS + 30);
  };

  const userGoTo = (target: number) => {
    setStopped(true);
    goTo(target);
  };

  // Re-enable the transition on the frame after a jump.
  useEffect(() => {
    if (animate) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setAnimate(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [animate]);

  useEffect(
    () => () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    },
    []
  );

  // Autoplay.
  useEffect(() => {
    if (!looping || hovered || stopped || reduced) return;
    const t = setTimeout(() => goTo(pos + 1), AUTOPLAY_MS);
    return () => clearTimeout(t);
  });

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    if (d.captured) e.currentTarget.releasePointerCapture(e.pointerId);
    drag.current = null;
    const dx = dragPx;
    setDragPx(0);
    if (dx <= -SWIPE_PX) userGoTo(pos + 1);
    else if (dx >= SWIPE_PX) userGoTo(pos - 1);
  };

  if (n === 0) return null;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className="[--per-view:1] md:[--per-view:2] lg:[--per-view:4]"
    >
      <div className="relative">
        <div
          className="touch-pan-y overflow-clip"
          onPointerDown={(e) => {
            if (!looping || e.button !== 0) return;
            drag.current = { x: e.clientX, captured: false };
            suppressClick.current = false;
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d) return;
            const dx = e.clientX - d.x;
            // Capture only once it is a real drag, so plain clicks still reach
            // the card links and buttons.
            if (!d.captured && Math.abs(dx) > 5) {
              d.captured = true;
              suppressClick.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
            }
            if (d.captured) setDragPx(dx);
          }}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClickCapture={(e) => {
            if (suppressClick.current) {
              e.preventDefault();
              e.stopPropagation();
              suppressClick.current = false;
            }
          }}
        >
          <div
            className="flex select-none"
            style={{
              gap: GAP_PX,
              // One inline value, so "off" really is off during the loop jump.
              transition:
                animate && dragPx === 0 ? `transform ${SPEED_MS}ms ease-out` : "none",
              transform: `translateX(calc(${-pos} * (100% + ${GAP_PX}px) / var(--per-view) + ${dragPx}px))`,
            }}
          >
            {slides.map((item, i) => {
              const clone = looping && (i < offset || i >= offset + n);
              return (
                <div
                  key={`${i}-${item.productId}`}
                  aria-hidden={clone || undefined}
                  inert={clone || undefined}
                  className="shrink-0"
                  style={{
                    flexBasis: `calc((100% - (var(--per-view) - 1) * ${GAP_PX}px) / var(--per-view))`,
                  }}
                >
                  <RelatedCard item={item} />
                </div>
              );
            })}
          </div>
        </div>

        {looping ? (
          <>
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => userGoTo(pos - 1)}
              className="absolute top-1/2 left-0 z-10 -translate-y-1/2 cursor-pointer p-0.5 text-[rgba(237,237,237,0.9)] hover:text-[#c8c8c8]"
            >
              <ChevronLeftIcon className="size-[25px]" />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => userGoTo(pos + 1)}
              className="absolute top-1/2 right-0 z-10 -translate-y-1/2 cursor-pointer p-0.5 text-[rgba(237,237,237,0.9)] hover:text-[#c8c8c8]"
            >
              <ChevronRightIcon className="size-[25px]" />
            </button>
          </>
        ) : null}
      </div>

      {looping ? (
        <div className="mt-1 flex justify-center">
          {items.map((item, i) => (
            <button
              key={item.productId}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === active}
              onClick={() => userGoTo(offset + i)}
              className="cursor-pointer p-1.5"
            >
              <span
                className={cn(
                  "block size-1.5 rounded-full bg-black",
                  i === active ? "opacity-100" : "opacity-20"
                )}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
