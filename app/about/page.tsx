import type { Metadata } from "next";
import Link from "next/link";
import { heroCopy, aboutCopy, trustBadges, faqItems } from "@/content/site-copy";
import { compliance } from "@/content/compliance";
import { pageMetadata } from "@/components/static/page-meta";
import { PageHeader } from "@/components/static/PageHeader";
import { SpecimenPlate } from "@/components/plate/SpecimenPlate";
import { FadeIn } from "@/components/motion/FadeIn";
import { InkWipe } from "@/components/motion/InkWipe";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description:
    "Primetime Research supplies analytical-grade research peptides — third-party tested for identity and purity, documented per batch, for laboratory use only.",
  path: "/about",
});

export default function AboutPage() {
  const purityFaq = faqItems.find(
    (f) => f.q === "What purity levels do you guarantee?"
  );

  return (
    <main>
      {/* ── Opening: verbatim lead + the duotoned testing figure ────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-16 md:px-6 md:pt-24">
        <PageHeader
          label="About"
          title="Primetime Research"
          sub={aboutCopy.tagline}
        />

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
            record={
              <span className="micro-label">
                Identity and purity — verified per batch
              </span>
            }
          />
        </FadeIn>
      </section>

      {/* ── Standards: the trophy figure + the verbatim trust records ───── */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
        <FadeIn>
          <p className="micro-label">Standards</p>
          <h2 className="mt-4 max-w-2xl text-[clamp(1.9rem,3.4vw,3rem)]">
            Tested for identity and purity. Documented every time.
          </h2>
        </FadeIn>

        <div className="mt-14 grid gap-x-16 gap-y-14 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
          {/* The number — the store's 99%+ claim with its verbatim basis */}
          <FadeIn>
            <p className="trophy-num text-[clamp(4.5rem,9vw,7.5rem)]">
              99<span className="trophy-pct">%+</span>
            </p>
            {purityFaq ? (
              <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-ink-muted">
                {purityFaq.a}
              </p>
            ) : null}
            <Link
              href="/coa"
              className="mt-5 inline-flex items-center text-sm font-medium text-green underline decoration-hairline underline-offset-4 transition-colors hover:text-green-deep hover:decoration-green"
            >
              View the certificates
            </Link>
          </FadeIn>

          {/* The 4 verbatim trust badges — varied soft cards, no monotony
              (the shared-hairline lattice is retired — soft pass 2026-07) */}
          <FadeIn>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {trustBadges.map((badge, i) => (
                <div
                  key={badge.title}
                  className={
                    i === 0
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
              {/* The assurance record — verbatim */}
              <div className="soft-card flex flex-col justify-center gap-3 p-6 sm:col-span-2 md:p-8">
                <p className="micro-label">Every batch</p>
                <p className="text-[15px] leading-relaxed text-ink">
                  {aboutCopy.assurance}
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── The chapter band: verbatim brand statement ──────────────────── */}
      <InkWipe>
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
          <p className="micro-label-dark">{aboutCopy.brand}</p>
          <h2 className="mt-5 max-w-3xl text-[clamp(1.9rem,3.6vw,3.2rem)]">
            {aboutCopy.headingLead}{" "}
            <span className="amber-display">{aboutCopy.headingEmphasis}</span>
          </h2>
          {/* Verbatim client copy — kept exactly as published. */}
          <p className="mt-7 max-w-2xl text-[16px] leading-[1.65] text-mint/90">
            {aboutCopy.body}
          </p>
        </div>
      </InkWipe>

      {/* ── Supply + standards lines (verbatim) and the honest story ────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-24">
        <FadeIn>
          <div className="grid max-w-4xl gap-8 md:grid-cols-2">
            <p className="border-t border-hairline pt-5 text-[14px] leading-relaxed text-ink-muted">
              {aboutCopy.standardsLine}
            </p>
            <p className="border-t border-hairline pt-5 text-[14px] leading-relaxed text-ink-muted">
              {aboutCopy.supplyLine}
            </p>
          </div>
        </FadeIn>

        {/* Honest placeholder — no invented founder story */}
        <FadeIn className="mt-16 max-w-3xl">
          <div className="plate">
            <div className="plate-field p-6 md:p-8">
              <p className="micro-label">Our story</p>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
                The team behind Primetime Research is writing this section now.
                Founder background and the full company story are coming soon.
                Until then, the work speaks through the catalog and the
                certificates behind it.
              </p>
              <Link
                href="/coa"
                className="mt-5 inline-flex items-center text-sm font-medium text-green underline decoration-hairline underline-offset-4 transition-colors hover:text-green-deep hover:decoration-green"
              >
                Browse the lab results
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── Compliance — the amber-wash record line ─────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-20 md:px-6 md:pb-28">
        <FadeIn>
          <div className="warn-line rounded-xl px-6 py-6 md:px-8 md:py-7">
            <p className="micro-label">Compliance</p>
            <p className="mt-3 max-w-3xl text-[15px] leading-relaxed font-medium text-ink">
              {compliance.ruoBanner}
            </p>
            <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-ink-muted">
              {compliance.fdaDisclaimer}
            </p>
          </div>
        </FadeIn>
      </section>
    </main>
  );
}
