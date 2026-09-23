"use client";

/**
 * Gallery — the live product template's image slider: one image at a time,
 * sliding every 3 s and rewinding after the last, with a thumbnail row below
 * (two per row, natural size; 40px squares on phones) and WooCommerce's
 * round "Sale!" badge on discounted products.
 *
 * Swipe or drag to change slides, click a thumbnail, or use the arrow keys
 * while the gallery is on screen (the live slider's keyboard option).
 * Differences from live, for usability: autoplay pauses while the pointer or
 * focus is on the gallery and is off for reduced motion, and the mouse wheel
 * does not change slides (live, it traps page scrolling over the image).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { catalogPage } from "@/content/site-copy";
import { cn } from "@/lib/utils";

export interface GalleryImage {
  src: string;
  alt: string;
  /** The store's thumbnail file (square crop for vials); falls back to src. */
  thumbnail?: string;
}

const AUTOPLAY_MS = 3000;
/** Drag distance (px) that commits a slide change. */
const SWIPE_PX = 50;

export function Gallery({
  images,
  name,
  onSale,
}: {
  images: GalleryImage[];
  name: string;
  onSale: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [dragPx, setDragPx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [paused, setPaused] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<number | null>(null);

  const count = images.length;
  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count]
  );

  // Autoplay: restarts after every slide change, like the live slider.
  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => go(index + 1), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [count, paused, index, go]);

  // Arrow keys move the slider while it is on screen and nothing editable
  // has focus.
  useEffect(() => {
    if (count < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      const r = rootRef.current?.getBoundingClientRect();
      if (!r || r.bottom <= 0 || r.top >= window.innerHeight) return;
      go(index + (e.key === "ArrowRight" ? 1 : -1));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [count, index, go]);

  const endDrag = () => {
    if (dragStart.current === null) return;
    if (dragPx <= -SWIPE_PX && index < count - 1) go(index + 1);
    else if (dragPx >= SWIPE_PX && index > 0) go(index - 1);
    dragStart.current = null;
    setDragging(false);
    setDragPx(0);
  };

  return (
    <div
      ref={rootRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={name}
      className="relative"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {onSale ? (
        <span className="absolute -top-[7px] -left-[7px] z-10 flex h-[50px] w-[44px] items-center justify-center rounded-[100%] bg-[#777335] text-[13.7px] font-bold text-white">
          {catalogPage.saleBadge}
        </span>
      ) : null}

      <div
        className={cn(
          "h-[450px] touch-pan-y overflow-hidden select-none",
          count > 1 && (dragging ? "cursor-grabbing" : "cursor-grab")
        )}
        onPointerDown={(e) => {
          if (count < 2 || e.button !== 0) return;
          dragStart.current = e.clientX;
          setDragging(true);
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (dragStart.current !== null) setDragPx(e.clientX - dragStart.current);
        }}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div
          className={cn(
            "flex h-full",
            !dragging && "transition-transform duration-300 ease-out motion-reduce:transition-none"
          )}
          style={{ transform: `translateX(calc(${-index * 100}% + ${dragPx}px))` }}
        >
          {images.map((img, i) => (
            <div
              key={`${img.src}-${i}`}
              className="relative h-full w-full shrink-0"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${count}`}
              aria-hidden={i !== index}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                draggable={false}
                sizes="(min-width: 1140px) 430px, (min-width: 768px) 38vw, 92vw"
                priority={i === 0}
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {count > 1 ? (
        <div
          role="group"
          aria-label="Product image thumbnails"
          className="mt-2.5 flex justify-center md:grid md:grid-cols-2 md:gap-[5px]"
        >
          {images.map((img, i) => (
            <button
              key={`${img.src}-${i}`}
              type="button"
              aria-label={`Show image ${i + 1} of ${count}`}
              aria-current={i === index}
              onClick={() => go(i)}
              className="relative size-10 cursor-pointer md:h-[150px] md:w-auto"
            >
              <Image
                src={img.thumbnail ?? img.src}
                alt=""
                fill
                sizes="150px"
                className="object-contain md:object-left"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
