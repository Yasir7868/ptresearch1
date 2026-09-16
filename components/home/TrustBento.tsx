/**
 * TrustBento — the four verbatim trustBadges in VARIED cell sizes (DESIGN
 * §7.5 — "no identical-card monotony"). Soft pass 2026-07: the shared-
 * hairline lattice is retired — cells are individually-rounded soft cards
 * with breathing gaps. The Research Use Only cell carries the warn-wash
 * (amber lives in the WASH, ink text on top — the sanctioned RUO treatment).
 *
 * Server component; copy verbatim from content/site-copy.ts.
 */

import { trustBadges } from "@/content/site-copy";
import { FadeIn, FadeInStagger } from "@/components/motion/FadeIn";
import { cn } from "@/lib/utils";

/**
 * The live site's "Credit Cards Accepted" badge is excluded: no card gateway
 * exists on the store (crypto + manual P2P only), so the claim is false —
 * honest-content rule (PRODUCT.md) outranks verbatim carryover here.
 */
const EXCLUDED_BADGES = new Set(["Credit Cards Accepted"]);
const badges = trustBadges.filter((b) => !EXCLUDED_BADGES.has(b.title));

/** Asymmetric spans on a 6-col grid: full-width RUO over 2/4. */
const SPANS = ["md:col-span-6", "md:col-span-2", "md:col-span-4"] as const;

export function TrustBento() {
  return (
    <section className="bg-bg">
      <div className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-24">
        <FadeInStagger
          className="grid grid-cols-1 gap-4 md:grid-cols-6 md:gap-5"
          staggerMs={70}
        >
          {badges.map((badge, i) => (
            <FadeIn
              key={badge.title}
              className={cn("min-w-0", SPANS[i % SPANS.length])}
            >
              <div
                className={cn(
                  "flex h-full flex-col justify-between p-6 md:p-8",
                  badge.title === "Research Use Only"
                    ? "warn-line rounded-xl shadow-card"
                    : "soft-card"
                )}
              >
                <h3 className="font-display text-[1.3rem] leading-tight tracking-[-0.025em] text-ink">
                  {badge.title}
                </h3>
                <p className="mt-6 max-w-md text-[14px] leading-relaxed text-ink-muted">
                  {badge.body}
                </p>
              </div>
            </FadeIn>
          ))}
        </FadeInStagger>
      </div>
    </section>
  );
}
