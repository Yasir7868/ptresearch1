"use client";

/**
 * DrawLine — hairline section divider that draws in (scaleX 0 → 1, left
 * origin) when it enters the viewport.
 *
 *   <DrawLine />                     // full-width hairline
 *   <DrawLine className="bg-white/10" />  // on the dark footer
 *
 * prefers-reduced-motion: renders static, no animation.
 */

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { D1_EASE } from "@/components/motion/FadeIn";

export function DrawLine({
  className,
  delayMs = 0,
}: {
  className?: string;
  delayMs?: number;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      aria-hidden="true"
      className={cn("h-px w-full origin-left bg-hairline", className)}
      initial={reduced ? false : { scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.7, ease: D1_EASE, delay: delayMs / 1000 }}
    />
  );
}
