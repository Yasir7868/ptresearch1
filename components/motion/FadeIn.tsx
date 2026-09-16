"use client";

/**
 * FadeIn — D1 section-entry motion: fade + rise 12px on viewport entry.
 *
 * Standalone:
 *   <FadeIn><h2>…</h2></FadeIn>
 *
 * Staggered group (60–90ms between children — spec default 75ms):
 *   <FadeInStagger>
 *     <FadeIn>…</FadeIn>
 *     <FadeIn>…</FadeIn>
 *   </FadeInStagger>
 *
 * Respects prefers-reduced-motion: opacity-only, no translate.
 */

import { createContext, useContext } from "react";
import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants,
} from "motion/react";

/** D1 easing — cubic-bezier(0.22, 1, 0.36, 1), durations 500–700ms. */
export const D1_EASE = [0.22, 1, 0.36, 1] as const;

const StaggerContext = createContext(false);

const viewport = { once: true, margin: "0px 0px -10% 0px" } as const;

function useFadeVariants(): Variants {
  const reduced = useReducedMotion();
  return {
    hidden: { opacity: 0, y: reduced ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: D1_EASE },
    },
  };
}

/**
 * Fade + 12px rise when the element enters the viewport (fires once).
 * Inside <FadeInStagger>, timing is orchestrated by the parent.
 */
export function FadeIn({
  children,
  ...props
}: HTMLMotionProps<"div">) {
  const insideStagger = useContext(StaggerContext);
  const variants = useFadeVariants();

  return (
    <motion.div
      variants={variants}
      {...(insideStagger
        ? {}
        : { initial: "hidden", whileInView: "visible", viewport })}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Orchestrates nested <FadeIn> children with a stagger (default 75ms —
 * inside the spec's 60–90ms window).
 */
export function FadeInStagger({
  children,
  staggerMs = 75,
  ...props
}: HTMLMotionProps<"div"> & { staggerMs?: number }) {
  return (
    <StaggerContext.Provider value={true}>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        transition={{ staggerChildren: staggerMs / 1000 }}
        {...props}
      >
        {children}
      </motion.div>
    </StaggerContext.Provider>
  );
}
