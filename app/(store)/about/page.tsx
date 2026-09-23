import type { Metadata } from "next";
import Link from "next/link";
import {
  aboutCopy,
  heroCopy,
  supplierBlock,
  trustBadges,
} from "@/content/site-copy";
import { brandConfig } from "@/content/brand-config";
import { compliance } from "@/content/compliance";
import { pageMetadata } from "@/components/static/page-meta";
import { PageHeader } from "@/components/static/PageHeader";
import { SpecimenPlate } from "@/components/plate/SpecimenPlate";
import { FadeIn } from "@/components/motion/FadeIn";
import { InkWipe } from "@/components/motion/InkWipe";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description: aboutCopy.body,
  path: "/about",
});

// The live site has no About page. Everything here is live homepage copy:
// the brand block, the hero body, the trust card, the supplier block, the
// trust badges, the about block, and the age-gate disclaimer.
export default function AboutPage() {
  return (
    <main>
      {/* ── Opening: brand block + hero body + the branded lab photograph ── */}
      <section className="mx-auto max-w-7xl px-4 pt-16 md:px-6 md:pt-24">
        <PageHeader title={brandConfig.name} sub={brandConfig.tagline} />

        <FadeIn className="mt-10 max-w-3xl">
          <p className="text-[17px] leading-[1.6] text-ink md:text-[19px]">
            {heroCopy.body}
          </p>
        </FadeIn>

        <FadeIn className="mt-16">
          {/* Branded lab scene (client hero photograph). duotone OFF — the
              vial labels are brand-navy already; the treatment would smudge
              the roundel (same exemption as /product-vials/). */}
          <SpecimenPlate
            interactive={false}
            cropColor="amber"
            imageFit="cover"
            fieldRatio="21 / 9"
            duotone={false}
            image={{
              src: "/images/hero.webp",
              alt: "Three Primetime Research branded peptide vials on a marble bench in the laboratory",
              width: 1672,
              height: 941,
            }}
            imageSizes="(min-width: 1280px) 1216px, 100vw"
          />
        </FadeIn>
      </section>

      {/* ── Supplier block + the trust card and badges ─────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
        <FadeIn>
          <p className="micro-label">{supplierBlock.eyebrow}</p>
          <h2 className="mt-4 max-w-3xl text-[clamp(1.9rem,3.4vw,3rem)]">
            {supplierBlock.heading}
          </h2>
          <p className="mt-5 max-w-3xl text-[15px] leading-relaxed text-ink-muted">
            {supplierBlock.body}
          </p>
        </FadeIn>

        <div className="mt-14 grid gap-x-16 gap-y-14 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
          {/* The number — the store's "99%+ Purity" trust card */}
          <FadeIn>
            <p className="micro-label">{heroCopy.trustHeading}</p>
            <p className="trophy-num mt-4 text-[clamp(4.5rem,9vw,7.5rem)]">
              99<span className="trophy-pct">%+</span>
            </p>
            <p className="micro-label mt-3">{heroCopy.trustStat.label}</p>
            <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-ink-muted">
              {heroCopy.trustBody}
            </p>
            <Link
              href="/coa"
              className="mt-5 inline-flex items-center text-sm font-medium text-green underline decoration-hairline underline-offset-4 transition-colors hover:text-green-deep hover:decoration-green"
            >
              {heroCopy.trustCta}
            </Link>
          </FadeIn>

          {/* The 4 verbatim trust badges — varied soft cards (first and
              last full width, the middle two side by side) */}
          <FadeIn>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {trustBadges.map((badge, i) => (
                <div
                  key={badge.title}
                  className={
                    i === 0 || i === trustBadges.length - 1
                      ? "soft-card flex flex-col gap-3 p-6 sm:col-span-2 md:p-8"
                      : "soft-card flex flex-col gap-3 p-6 md:p-8"
                  }
                >
                  <p className="micro-label">{badge.title}</p>
                  <p className="text-[14px] leading-relaxed text-ink-muted">
                    {badge.body}
                  </p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── The chapter band: the verbatim about block ──────────────────── */}
      <InkWipe>
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
          <p className="micro-label-dark">{aboutCopy.brand}</p>
          <h2 className="mt-5 max-w-3xl text-[clamp(1.9rem,3.6vw,3.2rem)]">
            {aboutCopy.headingLead}
            <br />
            <span className="amber-display">{aboutCopy.headingEmphasis}</span>
          </h2>
          {/* Verbatim client copy — kept exactly as published. */}
          <p className="mt-7 max-w-2xl text-[16px] leading-[1.65] text-mint/90">
            {aboutCopy.body}
          </p>
          <p className="mt-4 max-w-2xl text-[15px] leading-[1.65] text-mint/80">
            {aboutCopy.standardsLine}
          </p>
          <p className="mt-4 max-w-2xl text-[15px] leading-[1.65] text-(--mint-bright)">
            {aboutCopy.assurance}
          </p>
          <div className="mt-10 flex flex-wrap gap-x-12 gap-y-6 border-t border-mint/20 pt-8">
            {aboutCopy.stats.map((stat) => (
              <div key={stat.label}>
                <p className="amber-display font-display text-[clamp(1.8rem,3vw,2.4rem)] leading-none font-bold tracking-[-0.02em] [font-variant-numeric:tabular-nums_lining-nums]">
                  {stat.value}
                </p>
                <p className="micro-label-dark mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </InkWipe>

      {/* ── Compliance — the amber-wash record line ─────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
        <FadeIn>
          <div className="warn-line rounded-xl px-6 py-6 md:px-8 md:py-7">
            <p className="max-w-3xl text-[15px] leading-relaxed font-medium text-ink">
              {compliance.ageGateDisclaimer}
            </p>
          </div>
        </FadeIn>
      </section>
    </main>
  );
}
