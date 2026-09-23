/**
 * PromoBand — the navy chapter band under the hero, carrying what the live
 * homepage shows there: the "PEPTIDES FOR RESEARCH" ticker line and the
 * shipping strip "2-Day Shipping | Free Shipping $200+". The strip is the
 * band's amber display element; the band enters with the signature InkWipe
 * flood.
 *
 * Server component; copy verbatim from content/site-copy.ts + brandConfig.
 */

import { brandConfig } from "@/content/brand-config";
import { marquee } from "@/content/site-copy";
import { InkWipe } from "@/components/motion/InkWipe";

const { shippingSpeed, freeShipping } = brandConfig.promos;

export function PromoBand() {
  return (
    <InkWipe>
      <div className="mx-auto flex max-w-7xl flex-col items-start px-4 py-16 md:px-6 md:py-20">
        <p className="micro-label-dark">{marquee}</p>
        {/* Amber at display scale only — permitted inside a navy band. */}
        <p className="amber-display mt-4 font-display text-[clamp(2.2rem,4.8vw,3.6rem)] leading-[1.05] font-bold tracking-[-0.02em]">
          {shippingSpeed.label} | {freeShipping.label}
        </p>
      </div>
    </InkWipe>
  );
}
