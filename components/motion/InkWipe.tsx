"use client";

/**
 * InkWipe — the D3 signature motion beat (DESIGN §6). As a navy chapter band
 * scrolls into view, the navy floods from the section's bottom hairline UPWARD
 * (scaleY from bottom origin), and the content rises in behind the fill — like
 * ink flooding a page or a new chapter opening. Use ONLY on band transitions
 * (3–4× per homepage), never on ordinary content.
 *
 * Structure: a transparent wrapper carrying the navy FILL layer (animated,
 * --band) and a `.band-green-fg` content layer (mist-blue text contract, no
 * background of its own). The fill sits behind the content.
 *
 * Reduced motion: the fill appears instantly and the content cross-fades — no
 * transform, no layout shift. Fires once on enter.
 *
 * Usage:
 *   <InkWipe className="…full-bleed…">
 *     <div className="mx-auto max-w-7xl px-6 py-24">…mint content…</div>
 *   </InkWipe>
 */

import type { ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";

/** D3 easing — cubic-bezier(0.2, 0.8, 0.2, 1), 400–600ms. */
export const REFERENCE_EASE = [0.2, 0.8, 0.2, 1] as const;

const viewport = { once: true, margin: "0px 0px -12% 0px" } as const;

export function InkWipe({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();

  const fillVariants: Variants = {
    hidden: { scaleY: reduced ? 1 : 0, opacity: reduced ? 0 : 1 },
    visible: {
      scaleY: 1,
      opacity: 1,
      transition: { duration: reduced ? 0.4 : 0.6, ease: REFERENCE_EASE },
    },
  };

  const contentVariants: Variants = {
    hidden: { opacity: 0, y: reduced ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: REFERENCE_EASE,
        delay: reduced ? 0 : 0.18,
      },
    },
  };

  return (
    <motion.section
      className={className}
      style={{ position: "relative", isolation: "isolate" }}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
    >
      {/* Navy ink fill — floods upward from the bottom hairline. */}
      <motion.div
        aria-hidden="true"
        variants={fillVariants}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: -1,
          transformOrigin: "bottom",
          backgroundColor: "var(--band)",
        }}
      />
      <motion.div variants={contentVariants} className="band-green-fg">
        {children}
      </motion.div>
    </motion.section>
  );
}
