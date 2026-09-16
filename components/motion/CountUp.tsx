"use client";

/**
 * CountUp — stat number that counts up when it enters the viewport.
 *
 *   <CountUp value={99.4} decimals={1} suffix="%" className="text-accent" />
 *
 * Always renders via .data-mono (Satoshi 500, tabular lining figures).
 * NOTE (D3): purity trophy numerals are STATIC by spec — do NOT use CountUp for
 * them. Reserve this for incidental animated counters if ever wanted.
 * prefers-reduced-motion: renders the final value immediately, no animation.
 */

import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { D1_EASE } from "@/components/motion/FadeIn";

function format(value: number, decimals: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function CountUp({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  durationMs = 700,
  className,
}: {
  value: number;
  /** Fraction digits to render (e.g. 1 for purity percentages). */
  decimals?: number;
  prefix?: string;
  suffix?: string;
  /** Spec window 500–700ms. */
  durationMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduced = useReducedMotion();
  const [animatedDisplay, setAnimatedDisplay] = useState(() =>
    format(0, decimals)
  );

  useEffect(() => {
    if (!inView || reduced) return;
    const controls = animate(0, value, {
      duration: durationMs / 1000,
      ease: D1_EASE,
      // setState inside the animation callback (external system), not the
      // effect body — React 19 lint-compliant.
      onUpdate: (latest) => setAnimatedDisplay(format(latest, decimals)),
    });
    return () => controls.stop();
  }, [inView, reduced, value, decimals, durationMs]);

  // Reduced motion: render the final value directly — no animation, no state.
  const display = reduced ? format(value, decimals) : animatedDisplay;

  return (
    <span ref={ref} className={cn("data-mono", className)}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
