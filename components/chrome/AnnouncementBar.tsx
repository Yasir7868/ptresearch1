"use client";

/**
 * AnnouncementBar — slim green promo band above the header (D3).
 *
 * Thin bottle-green band, mint micro-labels, amber tick separators between the
 * four verbatim live offers.
 * Desktop (md+): all four offers in one row.
 * Mobile: cycles one offer at a time (4s interval, fade + 4px rise).
 * Promo strings come verbatim from content/brand-config.ts.
 * prefers-reduced-motion: instant swap, no transition.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { brandConfig } from "@/content/brand-config";
import { D1_EASE } from "@/components/motion/FadeIn";

const { promos } = brandConfig;

/**
 * DESIGN §7.4 / §10.6 content call: BOGO is the SINGLE storewide promo —
 * PT25 lives only on /affiliates. Running both at once reads as noise to
 * exactly the skeptical audience this direction courts, so the persistent
 * bar carries BOGO + the two shipping service lines only.
 */
const OFFERS: string[] = [
  `${promos.bogo.label} — ${promos.bogo.detail}`,
  promos.freeShipping.label,
  promos.shippingSpeed.label,
];

/**
 * Mobile cycle shows the verbatim promo LABELS only — the concatenated
 * "label — detail" form of the BOGO offer is wider than a 390px viewport and
 * would clip inside the h-9 nowrap strip.
 */
const OFFERS_COMPACT: string[] = [
  promos.bogo.label,
  promos.freeShipping.label,
  promos.shippingSpeed.label,
];

const CYCLE_MS = 4000;

export function AnnouncementBar() {
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => (i + 1) % OFFERS.length),
      CYCLE_MS
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="band-green">
      {/* md+: full row of offers, amber tick separators */}
      <div className="mx-auto hidden h-9 max-w-7xl items-center justify-center gap-3 px-6 md:flex">
        {OFFERS.map((offer, i) => (
          <span key={offer} className="flex items-center gap-3">
            {i > 0 && (
              <span
                aria-hidden="true"
                className="text-[11px] leading-none text-amber"
              >
                ·
              </span>
            )}
            <span className="micro-label-dark whitespace-nowrap">{offer}</span>
          </span>
        ))}
      </div>

      {/* Mobile: one offer at a time */}
      <div className="relative flex h-9 items-center justify-center overflow-hidden px-4 md:hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={index}
            className="micro-label-dark whitespace-nowrap"
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 1 } : { opacity: 0, y: -4 }}
            transition={{ duration: 0.35, ease: D1_EASE }}
          >
            {OFFERS_COMPACT[index]}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}
