/**
 * Hero — D3 "Reference Grade" opening movement (DESIGN §7.3), carrying the
 * live homepage hero verbatim.
 *
 * Left: kicker `HIGHEST QUALITY` → Satoshi display headline → verbatim body →
 * `View Catalog`. Right: the live trust card — `Trusted by Researchers
 * Worldwide`, the store's `99%+ Purity` claim as a poster-scale Satoshi TROPHY
 * NUMERAL, its verbatim line and `View COAs` — beside a specimen plate of the
 * client's branded hero photograph (full color — the vial labels carry the
 * brand).
 *
 * Server component; all copy verbatim from content/site-copy.ts. The only
 * motion on the numeral is the amber TickRule draw-in (client leaf) — the
 * figure itself is static by spec.
 */

import Link from "next/link";
import { heroCopy } from "@/content/site-copy";
import { SpecimenPlate } from "@/components/plate/SpecimenPlate";
import { FadeIn, FadeInStagger } from "@/components/motion/FadeIn";
import { TickRule } from "@/components/home/TickRule";

export function Hero() {
  const { trustStat } = heroCopy;
  const statNumber = trustStat.value.replace(/%\+?$/, "");

  return (
    <section className="paper-grain bg-bg">
      <div className="mx-auto max-w-7xl px-4 pt-14 pb-16 md:px-6 md:pt-20 md:pb-20">
        <div className="grid grid-cols-1 gap-x-12 gap-y-14 lg:grid-cols-12">
          {/* ── Left: headline + verbatim body + CTA ── */}
          <FadeInStagger className="lg:col-span-7">
            <FadeIn>
              <p className="micro-label">{heroCopy.eyebrow}</p>
            </FadeIn>

            <FadeIn>
              <h1 className="display-hero mt-5 text-[clamp(3rem,8vw,6.5rem)] text-ink">
                {heroCopy.heading}
              </h1>
            </FadeIn>

            <FadeIn>
              <p className="mt-7 max-w-xl text-[16px] leading-relaxed text-ink-muted md:text-[17px]">
                {heroCopy.body}
              </p>
            </FadeIn>

            <FadeIn>
              <div className="mt-9">
                <Link
                  href="/catalog"
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-green px-7 text-sm font-[540] tracking-[0.01em] text-surface transition-colors hover:bg-green-deep"
                >
                  {heroCopy.cta}
                </Link>
              </div>
            </FadeIn>
          </FadeInStagger>

          {/* ── Right: the live trust card + specimen plate ── */}
          <div className="lg:col-span-5">
            <FadeIn>
              <p className="micro-label">{heroCopy.trustHeading}</p>
              <p className="trophy-num mt-4 text-[clamp(4.5rem,14vw,10rem)]">
                {statNumber}
                <span className="trophy-pct">
                  %<span className="trophy-plus">+</span>
                </span>
              </p>
              <TickRule className="mt-3" />
              <p className="micro-label mt-4">{trustStat.label}</p>
              <p className="mt-3 max-w-sm text-[13.5px] leading-relaxed text-ink-muted">
                {heroCopy.trustBody}
              </p>
              <Link
                href="/coa"
                className="mt-6 inline-flex h-11 items-center justify-center rounded-lg border border-hairline bg-surface px-7 text-sm font-[540] tracking-[0.01em] text-ink transition-colors hover:border-green"
              >
                {heroCopy.trustCta}
              </Link>
            </FadeIn>

            <FadeIn className="mt-10">
              {/* The client's branded hero photograph — three labeled Primetime
                  vials on marble. duotone OFF (the labels are already brand-navy;
                  the treatment would smudge the roundel — same exemption as
                  /product-vials/), object-right so the 4:3 cover crop keeps the
                  vials and sheds the scene's empty left negative space. */}
              <SpecimenPlate
                image={{
                  src: "/images/hero.webp",
                  alt: "Three Primetime Research branded peptide vials standing on a marble bench in a laboratory.",
                  width: 1672,
                  height: 941,
                }}
                imageFit="cover"
                imageClassName="object-right"
                duotone={false}
                fieldRatio="4 / 3"
                imageSizes="(min-width: 1024px) 480px, 92vw"
                imagePriority
                cropColor="amber"
                interactive={false}
              />
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}
