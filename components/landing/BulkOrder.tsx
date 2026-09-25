/**
 * BulkOrder — the homepage bulk/wholesale section (2026-09 CRO redesign
 * language, DESIGN.md §0: mist ground, cobalt kicker, Source Serif heading,
 * 14px rounded white cards on `rule` hairlines).
 *
 * Two columns on wide viewports: the pitch and its two actions on the left,
 * the volume ladder on the right. The ladder is a real table — it is tabular
 * data, and a researcher scanning thresholds against percentages is the whole
 * point of the section.
 *
 * Every rung is read from content/bulk.ts, including the closing
 * "custom quote" row, so the homepage can never quote a tier the /bulk
 * builder and the cart do not honour.
 *
 * Server component: no state, no cart. The tier ladder is static content.
 */

import Link from "next/link";
import { bulkCopy } from "@/content/bulk";
import { bulkLadder } from "@/lib/bulk";
import { Arrow, CONTAINER, Kicker, PRIMARY_CTA, SERIF } from "./parts";
import { cn } from "@/lib/utils";

const copy = bulkCopy.home;

export function BulkOrder() {
  const ladder = bulkLadder();

  return (
    <section id="bulk" className="bg-white">
      <div
        className={cn(
          CONTAINER,
          "grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] items-start gap-10 py-16"
        )}
      >
        <div>
          <Kicker>{copy.eyebrow}</Kicker>
          <h2
            className={cn(
              SERIF,
              "mt-2 mb-4 text-[clamp(28px,3.8vw,42px)] tracking-[-0.015em] text-pretty text-navy-ink"
            )}
          >
            {copy.heading}
          </h2>
          <p className="max-w-[56ch] text-[16px] leading-[1.65] text-steel-ink">
            {copy.body}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/bulk" className={PRIMARY_CTA}>
              {copy.cta} <Arrow />
            </Link>
            <Link
              href="/bulk#quote"
              className="inline-flex h-[52px] items-center gap-2 rounded-[12px] border border-rule bg-white px-[22px] text-[16px] font-bold text-navy transition-colors hover:border-cobalt hover:text-cobalt"
            >
              {copy.secondaryCta}
            </Link>
          </div>

          <p className="mt-4 text-[13px] text-steel">{copy.note}</p>
        </div>

        <div className="overflow-hidden rounded-[14px] border border-rule bg-mist">
          <h3 className="border-b border-rule px-5 py-3.5 text-[13px] font-extrabold tracking-[0.08em] text-navy uppercase">
            {copy.ladderHeading}
          </h3>

          <table className="w-full border-collapse text-left">
            <caption className="sr-only">{copy.ladderHeading}</caption>
            <thead>
              <tr className="border-b border-rule">
                <th
                  scope="col"
                  className="px-5 py-2.5 text-[12px] font-bold text-steel"
                >
                  {copy.unitsHeading}
                </th>
                <th
                  scope="col"
                  className="px-5 py-2.5 text-right text-[12px] font-bold text-steel"
                >
                  {copy.discountHeading}
                </th>
              </tr>
            </thead>
            <tbody>
              {ladder.map((tier) => (
                <tr key={tier.code} className="border-b border-rule/70">
                  <th scope="row" className="px-5 py-3.5 font-normal">
                    <span className="block text-[15px] font-extrabold text-navy-ink tabular-nums">
                      {tier.label}
                    </span>
                    <span className="mt-0.5 block text-[13px] text-steel">
                      {copy.unitsHeading}
                    </span>
                  </th>
                  <td className="px-5 py-3.5 text-right align-top text-[18px] font-extrabold text-cobalt tabular-nums">
                    {tier.percentOff}% off
                  </td>
                </tr>
              ))}

              {/* The quote rung — deliberately not a percentage. */}
              <tr className="bg-white">
                <th scope="row" className="px-5 py-3.5 font-normal">
                  <span className="block text-[15px] font-extrabold text-navy-ink tabular-nums">
                    {copy.quoteLabel}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-steel">
                    {copy.quotePerk}
                  </span>
                </th>
                <td className="px-5 py-3.5 text-right align-top">
                  <Link
                    href="/bulk#quote"
                    className="text-[15px] font-extrabold text-cobalt underline-offset-4 hover:underline"
                  >
                    {copy.quoteValue}
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
