"use client";

/**
 * TickRule — the single amber tick-underline that draws in beneath a trophy
 * purity numeral (DESIGN §6). Per spec this is the ONLY motion a purity
 * numeral gets — the number itself appears fully formed and static.
 *
 * Amber as a small GRAPHIC mark (never text) — sanctioned by the PDP
 * blueprint's "trophy purity numeral with amber tick-underline".
 *
 * Reduced motion: plain opacity fade, no scale.
 */

import { motion, useReducedMotion } from "motion/react";
import { REFERENCE_EASE } from "@/components/motion/InkWipe";
import { cn } from "@/lib/utils";

export function TickRule({ className }: { className?: string }) {
  const reduced = useReducedMotion();

  return (
    <motion.span
      aria-hidden="true"
      className={cn("block h-[3px] w-16 origin-left bg-amber", className)}
      initial={reduced ? { opacity: 0 } : { scaleX: 0 }}
      whileInView={reduced ? { opacity: 1 } : { scaleX: 1 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.5, ease: REFERENCE_EASE, delay: 0.15 }}
    />
  );
}
