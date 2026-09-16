/**
 * PromoBand — green promo chapter band (DESIGN §7.4). BOGO is the SINGLE
 * homepage promo by spec (PT25 lives on /affiliates only); the headline is the
 * band's amber display element, the fine print stays verbatim, and the band
 * enters with the signature InkWipe flood.
 *
 * Server component; copy verbatim from content/site-copy.ts
 * (promoStrings.homepageBanner). InkWipe is the client leaf.
 */

import Link from "next/link";
import { promoStrings } from "@/content/site-copy";
import { InkWipe } from "@/components/motion/InkWipe";

const { label, headline, cta, fine } = promoStrings.homepageBanner;

export function PromoBand() {
  return (
    <InkWipe>
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-10 px-4 py-16 md:flex-row md:items-center md:justify-between md:px-6 md:py-20">
        <div>
          <p className="micro-label-dark">{label}</p>
          {/* Amber at display scale only — permitted inside a green band. */}
          <p className="amber-display mt-4 font-display text-[clamp(2.2rem,4.8vw,3.6rem)] leading-[1.05] font-bold tracking-[-0.02em]">
            {headline}
          </p>
          <p className="micro-label-dark mt-5">{fine}</p>
        </div>

        <Link
          href="/catalog"
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-surface px-7 text-sm font-[540] tracking-[0.01em] text-green transition-colors hover:bg-mint"
        >
          {cta}
        </Link>
      </div>
    </InkWipe>
  );
}
