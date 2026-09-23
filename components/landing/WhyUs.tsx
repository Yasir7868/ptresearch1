/**
 * WhyUs — the live supplier block ("Advancing Scientific Discovery with
 * Premium Research Peptides" + its paragraph) beside the four live trust
 * badges as white cards. All copy live (supplierBlock, trustBadges).
 * Server component.
 */

import { brandConfig } from "@/content/brand-config";
import { supplierBlock, trustBadges } from "@/content/site-copy";
import { CONTAINER, Kicker, SERIF } from "./parts";
import { cn } from "@/lib/utils";

export function WhyUs() {
  return (
    <section
      className={cn(
        CONTAINER,
        "grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-10 py-16"
      )}
    >
      <div>
        <Kicker>{brandConfig.name}</Kicker>
        <h2
          className={cn(
            SERIF,
            "mt-2 mb-4 text-[clamp(28px,3.8vw,42px)] tracking-[-0.015em] text-pretty text-navy-ink"
          )}
        >
          {supplierBlock.heading}
        </h2>
        <p className="text-[16px] leading-[1.65] text-steel-ink">
          {supplierBlock.body}
        </p>
      </div>

      <ul className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
        {trustBadges.map((badge) => (
          <li
            key={badge.title}
            className="rounded-[14px] border border-rule bg-white p-5"
          >
            <h3 className="mb-1.5 text-[16px] font-extrabold text-navy-ink">
              {badge.title}
            </h3>
            <p className="text-[14px] leading-[1.5] text-steel">{badge.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
