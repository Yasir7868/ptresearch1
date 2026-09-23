/**
 * CtaBand — the closing midnight band: the live "Your trusted source for
 * high-purity peptides" heading and View Catalog. The design's subline
 * ("Orders placed before 2 PM CT ship the same business day.") is not a live
 * commitment, so the band carries the live shipping strip instead.
 * Server component.
 */

import Link from "next/link";
import { brandConfig } from "@/content/brand-config";
import { aboutCopy, heroCopy } from "@/content/site-copy";
import { Arrow, CONTAINER, PRIMARY_CTA, SERIF } from "./parts";
import { cn } from "@/lib/utils";

const { shippingSpeed, freeShipping } = brandConfig.promos;

export function CtaBand() {
  return (
    <section className="bg-midnight text-white">
      <div
        className={cn(
          CONTAINER,
          "flex flex-wrap items-center justify-between gap-5 py-14"
        )}
      >
        <div>
          <h2
            className={cn(
              SERIF,
              "mb-1.5 text-[clamp(26px,3.5vw,36px)] tracking-[-0.01em] text-white"
            )}
          >
            {aboutCopy.headingLead}{" "}
            <span className="whitespace-nowrap text-azure">
              {aboutCopy.headingEmphasis}
            </span>
          </h2>
          <p className="text-[15px] text-haze">
            {shippingSpeed.label} · {freeShipping.label}
          </p>
        </div>
        <Link href="/catalog" className={PRIMARY_CTA}>
          {heroCopy.cta} <Arrow />
        </Link>
      </div>
    </section>
  );
}
