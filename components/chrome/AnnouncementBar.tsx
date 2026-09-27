"use client";

/**
 * AnnouncementBar — the slim navy research bar above the header (2026-09 CRO
 * redesign, DESIGN.md §0).
 *
 * - Homepage: the design's line — "FOR RESEARCH USE ONLY · 2-DAY SHIPPING ·
 *   FREE SHIPPING $200+" (compliance.ruoStrip + brandConfig.promos).
 * - Every other page: the live PT25 promo banner — "LIMITED OFFER", "USE
 *   CODE: PT25", "25% off all Research Compounds", "Shop Now", same bar.
 *
 * ONE ROW ON PHONES. Both lines are too long for a 390px screen and wrapped
 * to two rows, which cost ~17px of height above a hero that is already
 * height-capped (owner request 2026-09-28). So on phones the row is a fixed
 * 32px and only the offers cycle, every 4s — nothing is dropped, it arrives
 * in turn. On the homepage "FOR RESEARCH USE ONLY" does NOT cycle: the RUO
 * line is compliance framing, not a promo (PRODUCT.md), so it is pinned and
 * the two shipping offers alternate beside it — measured to fit at 390px.
 * From md the whole line sits in one row as before.
 * prefers-reduced-motion swaps parts instantly instead of fading.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { brandConfig } from "@/content/brand-config";
import { compliance } from "@/content/compliance";
import { D1_EASE } from "@/components/motion/FadeIn";

const { coupon, shippingSpeed, freeShipping } = brandConfig.promos;

/** The homepage line: the pinned RUO strip, then the offers that alternate. */
const HOME_PINNED = compliance.ruoStrip.toUpperCase();
const HOME_OFFERS = [shippingSpeed.label, freeShipping.label].map((part) =>
  part.toUpperCase()
);
const HOME_PARTS = [HOME_PINNED, ...HOME_OFFERS];

const PROMO_PARTS = [
  `${coupon.badge} · ${coupon.codeLabel} ${coupon.code}`,
  coupon.detail,
];

const CYCLE_MS = 4000;

const BAR = "bg-navy font-manrope leading-[normal] text-white";
const LINE =
  "text-[11px] font-bold tracking-[0.14em] uppercase sm:text-[12px] sm:tracking-[0.18em]";

export function AnnouncementBar() {
  const isHome = usePathname() === "/";
  const parts = isHome ? HOME_OFFERS : PROMO_PARTS;
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    // No reset on route change: both lists hold two parts and the render
    // takes the index modulo, so a carried-over index is always in range.
    const id = setInterval(
      () => setIndex((i) => (i + 1) % parts.length),
      CYCLE_MS
    );
    return () => clearInterval(id);
  }, [parts.length]);

  return (
    <div className={BAR}>
      {/* md+: the whole line in one row */}
      <div
        className={`${LINE} mx-auto hidden max-w-[1240px] items-center justify-center gap-3 px-6 py-2 md:flex`}
      >
        {isHome ? (
          <span>{HOME_PARTS.join(" · ")}</span>
        ) : (
          <>
            <span className="whitespace-nowrap">{PROMO_PARTS[0]}</span>
            <span aria-hidden="true">·</span>
            <span className="whitespace-nowrap">{PROMO_PARTS[1]}</span>
            <span aria-hidden="true">·</span>
            <Link
              href="/catalog"
              className="whitespace-nowrap text-white underline underline-offset-4 hover:text-haze-pale"
            >
              {coupon.cta}
            </Link>
          </>
        )}
      </div>

      {/* Phones: fixed 32px row — RUO pinned on the homepage, offers cycle */}
      <div className="relative flex h-8 items-center justify-center gap-2 overflow-hidden px-4 md:hidden">
        {isHome ? (
          <>
            <span className={`${LINE} whitespace-nowrap`}>{HOME_PINNED}</span>
            <span aria-hidden="true" className={LINE}>
              ·
            </span>
          </>
        ) : null}
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={index}
            className={`${LINE} whitespace-nowrap`}
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 1 } : { opacity: 0, y: -4 }}
            transition={{ duration: 0.35, ease: D1_EASE }}
          >
            {parts[index % parts.length]}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}
