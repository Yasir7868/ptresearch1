"use client";

/**
 * TickRule — the amber tick-underline beneath a trophy purity numeral.
 *
 * DESIGN §6: purity numerals appear fully-formed and STATIC (no count-up);
 * "their only motion is a single amber tick-underline that draws in." This is
 * that one permitted beat — a 2px amber rule that scales in from the left.
 *
 * Amber here is a GRAPHIC mark, never text (the accessibility hard rule bans
 * amber TEXT on paper; crop ticks / batch ticks / this rule are the sanctioned
 * graphic uses). Reduced motion: the draw collapses to a plain opacity fade.
 */

import { motion, useReducedMotion } from "motion/react";
import { REFERENCE_EASE } from "@/components/motion/InkWipe";
import { cn } from "@/lib/utils";

export function TickRule({ className }: { className?: string }) {
  const reduced = useReducedMotion();

  return (
    <motion.span
      aria-hidden="true"
      className={cn("block h-[2px] w-14 origin-left bg-amber", className)}
      initial={reduced ? { opacity: 0 } : { scaleX: 0 }}
      animate={reduced ? { opacity: 1 } : { scaleX: 1 }}
      transition={{ duration: 0.5, ease: REFERENCE_EASE, delay: 0.2 }}
    />
  );
}
