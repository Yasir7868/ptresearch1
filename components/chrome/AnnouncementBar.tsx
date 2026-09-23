"use client";

/**
 * AnnouncementBar — the slim navy research bar above the header (2026-09 CRO
 * redesign, DESIGN.md §0).
 *
 * - Homepage: the design's line — "FOR RESEARCH USE ONLY · 2-DAY SHIPPING ·
 *   FREE SHIPPING $200+" (compliance.ruoStrip + brandConfig.promos).
 * - Every other page: the live PT25 promo banner — "LIMITED OFFER", "USE CODE:
 *   PT25", "25% off all Research Compounds", "Shop Now" (brandConfig.promos),
 *   in the same bar.
 *
 * Desktop (md+): the promo in one row. Mobile: it cycles one line at a time
 * (4s interval, fade + 4px rise); prefers-reduced-motion swaps instantly.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { brandConfig } from "@/content/brand-config";
import { compliance } from "@/content/compliance";
import { D1_EASE } from "@/components/motion/FadeIn";

const { coupon, shippingSpeed, freeShipping } = brandConfig.promos;

const HOME_LINE = [compliance.ruoStrip, shippingSpeed.label, freeShipping.label]
  .join(" · ")
  .toUpperCase();

const PROMO_LINES: string[] = [
  `${coupon.badge} · ${coupon.codeLabel} ${coupon.code}`,
  coupon.detail,
];

const CYCLE_MS = 4000;

const BAR = "bg-navy font-manrope leading-[normal] text-white";
const LINE = "text-[12px] font-bold tracking-[0.18em] uppercase";

export function AnnouncementBar() {
  const isHome = usePathname() === "/";
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (isHome) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % PROMO_LINES.length),
      CYCLE_MS
    );
    return () => clearInterval(id);
  }, [isHome]);

  if (isHome) {
    return (
      <div className={BAR}>
        <p className={`${LINE} px-4 py-2 text-center`}>{HOME_LINE}</p>
      </div>
    );
  }

  return (
    <div className={BAR}>
      {/* md+: the full promo banner in one row */}
      <div
        className={`${LINE} mx-auto hidden max-w-[1240px] items-center justify-center gap-3 px-6 py-2 md:flex`}
      >
        <span className="whitespace-nowrap">
          {coupon.badge} · {coupon.codeLabel} {coupon.code}
        </span>
        <span aria-hidden="true">·</span>
        <span className="whitespace-nowrap">{coupon.detail}</span>
        <span aria-hidden="true">·</span>
        <Link
          href="/catalog"
          className="whitespace-nowrap text-white underline underline-offset-4 hover:text-haze-pale"
        >
          {coupon.cta}
        </Link>
      </div>

      {/* Mobile: one line at a time */}
      <div className="relative flex h-[33px] items-center justify-center overflow-hidden px-4 md:hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={index}
            className={`${LINE} whitespace-nowrap`}
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 1 } : { opacity: 0, y: -4 }}
            transition={{ duration: 0.35, ease: D1_EASE }}
          >
            {PROMO_LINES[index]}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}
