/**
 * StatsRow — the live homepage supplier block: "Trusted Research Supplier" /
 * "Advancing Scientific Discovery with Premium Research Peptides", its
 * paragraph, and the four verbatim stats, set MODESTLY in bold Satoshi +
 * tabular figures. Static — no count-up, by spec. (The live site's emoji stat
 * icons are dropped — no emoji, PRODUCT.md.)
 *
 * Server component; copy verbatim from content/site-copy.ts.
 */

import { supplierBlock } from "@/content/site-copy";
import { FadeIn } from "@/components/motion/FadeIn";

export function StatsRow() {
  return (
    <section className="hairline-y bg-bg">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
        <FadeIn className="max-w-3xl">
          <p className="micro-label">{supplierBlock.eyebrow}</p>
          <h2 className="mt-4 text-[clamp(1.9rem,3.4vw,3rem)]">
            {supplierBlock.heading}
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-ink-muted">
            {supplierBlock.body}
          </p>
        </FadeIn>

        <FadeIn className="mt-12 flex flex-wrap items-baseline justify-between gap-x-12 gap-y-8">
          {supplierBlock.stats.map((stat) => (
            <div key={stat.label} className="min-w-32">
              <p className="font-display text-[clamp(1.5rem,2.4vw,2rem)] leading-none font-bold tracking-[-0.02em] text-ink [font-variant-numeric:tabular-nums_lining-nums]">
                {stat.value}
              </p>
              <p className="mt-2 text-[13px] leading-snug text-ink-muted">
                {stat.label}
              </p>
            </div>
          ))}
        </FadeIn>
      </div>
    </section>
  );
}
