/**
 * TestingStory — the About/testing CHAPTER BAND (DESIGN §7.9): the verbatim
 * aboutCopy movement (tagline, standards line, the "No exceptions. No
 * shortcuts." assurance) beside the client's branded lab photograph as a
 * specimen plate on the navy band. The verbatim
 * third-party-testing Q&A from /faq/ sits with it, so the claim and its
 * evidence stay co-located (DESIGN §9.5). Enters with the InkWipe flood.
 *
 * NOTE: aboutCopy.body contains "empower" — a banned word in house style but
 * VERBATIM client copy; kept by default, flagged for intake (DESIGN §7.9).
 *
 * Server component; copy verbatim from content/site-copy.ts.
 */

import Link from "next/link";
import { aboutCopy, faqItems } from "@/content/site-copy";
import { SpecimenPlate } from "@/components/plate/SpecimenPlate";
import { InkWipe } from "@/components/motion/InkWipe";

// Verbatim third-party-testing Q&A from the live /faq/ page.
const thirdParty = faqItems.find(
  (f) => f.q === "Are your peptides third-party tested?"
);

export function TestingStory() {
  return (
    <InkWipe>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-x-16 gap-y-14 px-4 py-24 md:grid-cols-2 md:px-6 md:py-32">
        {/* ── Copy column — verbatim about movement ── */}
        <div>
          <p className="micro-label-dark">{aboutCopy.tagline}</p>
          <h2 className="mt-4 text-[clamp(1.9rem,3.4vw,3rem)]">
            {aboutCopy.headingLead}{" "}
            <span className="amber-display">{aboutCopy.headingEmphasis}</span>
          </h2>

          <p className="mt-7 text-[15px] leading-relaxed">{aboutCopy.body}</p>
          <p className="mt-4 text-[15px] leading-relaxed text-mint/80">
            {aboutCopy.standardsLine}
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-(--mint-bright)">
            {aboutCopy.assurance}
          </p>

          {thirdParty && (
            // Band-inner content container — 20px radius (soft scale); the
            // full-bleed band itself stays square at the viewport edges.
            <div className="mt-9 rounded-2xl border border-mint/25 p-5 md:p-6">
              <p className="micro-label-dark">{thirdParty.q}</p>
              <p className="mt-3 text-[14px] leading-relaxed">
                {thirdParty.a}
              </p>
            </div>
          )}

          <p className="mt-8 max-w-xl text-[12.5px] leading-relaxed text-mint/70">
            {aboutCopy.supplyLine}
          </p>
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
          <p className="mt-6">
            <Link
              href="/coa"
              className="text-sm font-[540] text-(--mint-bright) underline-offset-4 transition-colors hover:text-surface hover:underline"
            >
              View Lab Results →
            </Link>
          </p>
        </div>
      </div>
    </InkWipe>
  );
}
