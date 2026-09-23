/**
 * TrustBento — the live homepage brand block: "Primetime Research" /
 * "Empowering Ideas Through Research" over the four verbatim trustBadges, in
 * VARIED cell sizes (DESIGN §7.5 — "no identical-card monotony"). Cells are
 * individually-rounded soft cards with breathing gaps. The Research Use Only
 * cell carries the warn-wash (amber lives in the WASH, ink text on top — the
 * sanctioned RUO treatment).
 *
 * Server component; copy verbatim from content/site-copy.ts + brandConfig.
 */

import { brandConfig } from "@/content/brand-config";
import { trustBadges } from "@/content/site-copy";
import { FadeIn, FadeInStagger } from "@/components/motion/FadeIn";
import { cn } from "@/lib/utils";

/** Asymmetric spans on a 6-col grid: full-width RUO, 2/4, full-width. */
const SPANS = [
  "md:col-span-6",
  "md:col-span-2",
  "md:col-span-4",
  "md:col-span-6",
] as const;

export function TrustBento() {
  return (
    <section className="bg-bg">
      <div className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-24">
        <FadeIn>
          <p className="micro-label">{brandConfig.name}</p>
          <h2 className="mt-4 max-w-2xl text-[clamp(1.9rem,3.4vw,3rem)]">
            {brandConfig.tagline}
          </h2>
        </FadeIn>

        <FadeInStagger
          className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-6 md:gap-5"
          staggerMs={70}
        >
          {trustBadges.map((badge, i) => (
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
