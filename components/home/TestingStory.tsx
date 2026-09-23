/**
 * TestingStory — the About CHAPTER BAND (DESIGN §7.9), carrying the live
 * homepage about block verbatim: "Primetime Research" / "Your trusted source
 * for high-purity peptides", the body, standards line and "No exceptions. No
 * shortcuts." assurance, `View Catalog`, and the 99% / 50+ / 12+ stats —
 * beside the client's branded lab photograph as a specimen plate on the navy
 * band. Enters with the InkWipe flood.
 *
 * NOTE: aboutCopy.body contains "empower" — a banned word in house style but
 * VERBATIM client copy, kept as published.
 *
 * Server component; copy verbatim from content/site-copy.ts.
 */

import Link from "next/link";
import { aboutCopy } from "@/content/site-copy";
import { SpecimenPlate } from "@/components/plate/SpecimenPlate";
import { InkWipe } from "@/components/motion/InkWipe";

export function TestingStory() {
  return (
    <InkWipe>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-x-16 gap-y-14 px-4 py-24 md:grid-cols-2 md:px-6 md:py-32">
        {/* ── Copy column — verbatim about block ── */}
        <div>
          <p className="micro-label-dark">{aboutCopy.brand}</p>
          <h2 className="mt-4 text-[clamp(1.9rem,3.4vw,3rem)]">
            {aboutCopy.headingLead}
            <br />
            <span className="amber-display">{aboutCopy.headingEmphasis}</span>
          </h2>

          <p className="mt-7 text-[15px] leading-relaxed">{aboutCopy.body}</p>
          <p className="mt-4 text-[15px] leading-relaxed text-mint/80">
            {aboutCopy.standardsLine}
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-(--mint-bright)">
            {aboutCopy.assurance}
          </p>

          <Link
            href="/catalog"
            className="mt-9 inline-flex h-11 items-center justify-center rounded-lg bg-surface px-7 text-sm font-[540] tracking-[0.01em] text-green transition-colors hover:bg-mint"
          >
            {aboutCopy.cta}
          </Link>

          <div className="mt-12 flex flex-wrap gap-x-12 gap-y-6 border-t border-mint/20 pt-8">
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

        {/* ── Specimen plate — the branded lab photograph (client hero scene).
            duotone OFF: the vial labels are already brand-navy and the
            treatment smudges the roundel (same exemption as /product-vials/).
            object-right keeps the vials in the 4:3 crop. ── */}
        <div className="md:pt-10">
          <SpecimenPlate
            image={{
              src: "/images/hero.webp",
              alt: "Three Primetime Research branded peptide vials on a marble bench in the testing laboratory.",
              width: 1672,
              height: 941,
            }}
            imageFit="cover"
            imageClassName="object-right"
            duotone={false}
            fieldRatio="4 / 3"
            imageSizes="(min-width: 768px) 560px, 92vw"
            cropColor="amber"
            interactive={false}
          />
        </div>
      </div>
    </InkWipe>
  );
}
