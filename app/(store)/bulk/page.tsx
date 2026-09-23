/**
 * /bulk — volume ordering.
 *
 * Reached from the homepage bulk section, the header and the footer. The page
 * is the CRO-redesign language (DESIGN.md §0) rather than D3: it is the
 * destination of a homepage section and must read as the same surface, and it
 * is a new page with no D3 precedent to preserve. Source Serif 4 loads here
 * for the same reason it loads on the homepage — this page uses it, no other
 * page has to pay for it.
 *
 * Server component. The catalog is fetched once and handed to the builder;
 * the builder and the quote form are the only client leaves.
 *
 * Order: header → tier ladder → builder (the work) → why bulk → FAQ →
 * quote form (#quote) → closing CTA band.
 */

import type { Metadata } from "next";
import localFont from "next/font/local";
import { getCatalog } from "@/lib/woo/catalog";
import { bulkCopy } from "@/content/bulk";
import { compliance } from "@/content/compliance";
import { bulkLadder } from "@/lib/bulk";
import { pageMetadata } from "@/components/static/page-meta";
import { cn } from "@/lib/utils";
import { CONTAINER, Kicker, SERIF } from "@/components/landing/parts";
import { CtaBand } from "@/components/landing/CtaBand";
import { BulkBuilder } from "@/components/bulk/BulkBuilder";
import { BulkQuoteForm } from "@/components/bulk/BulkQuoteForm";

const sourceSerif = localFont({
  src: "../../fonts/SourceSerif4-SemiBold-latin.woff2",
  weight: "600",
  style: "normal",
  variable: "--font-source-serif-face",
  display: "swap",
  preload: true,
  fallback: ["Georgia", "Times New Roman", "serif"],
});

export const metadata: Metadata = pageMetadata({
  title: bulkCopy.page.title,
  description: bulkCopy.page.metaDescription,
  path: "/bulk",
});

export default async function BulkPage() {
  const catalog = await getCatalog();
  const ladder = bulkLadder();

  return (
    <main
      className={cn(
        sourceSerif.variable,
        "landing flex flex-col bg-mist font-manrope leading-[normal] text-navy-ink"
      )}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <section className="bg-midnight text-white">
        <div className={cn(CONTAINER, "py-14")}>
          <p className="text-[12px] font-bold tracking-[0.16em] text-azure uppercase">
            {bulkCopy.page.eyebrow}
          </p>
          <h1
            className={cn(
              SERIF,
              "mt-2 mb-4 max-w-[20ch] text-[clamp(32px,5vw,52px)] tracking-[-0.02em] text-pretty text-white"
            )}
          >
            {bulkCopy.page.heading}
          </h1>
          <p className="max-w-[62ch] text-[17px] leading-[1.6] text-haze">
            {bulkCopy.page.body}
          </p>
        </div>
      </section>

      {/* ── Tier ladder ─────────────────────────────────────────────────── */}
      <section className={cn(CONTAINER, "pt-12")}>
        <h2 className="sr-only">{bulkCopy.home.ladderHeading}</h2>
        <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(190px,100%),1fr))] gap-3">
          {ladder.map((tier) => (
            <li
              key={tier.code}
              className="rounded-[14px] border border-rule bg-white p-5"
            >
              <p className="text-[13px] font-bold text-steel tabular-nums">
                {tier.label}
              </p>
              <p className="mt-1 text-[30px] leading-none font-extrabold text-cobalt tabular-nums">
                {tier.percentOff}%
                <span className="ml-1 text-[15px] font-bold text-navy-ink">
                  off
                </span>
              </p>
              <p className="mt-2 text-[13px] leading-[1.45] text-steel">
                {tier.perk}
              </p>
            </li>
          ))}
          <li className="rounded-[14px] border border-navy bg-navy p-5 text-white">
            <p className="text-[13px] font-bold text-azure tabular-nums">
              {bulkCopy.home.quoteLabel}
            </p>
            <p className="mt-1 text-[22px] leading-tight font-extrabold text-white">
              {bulkCopy.home.quoteValue}
            </p>
            <p className="mt-2 text-[13px] leading-[1.45] text-haze">
              {bulkCopy.home.quotePerk}
            </p>
          </li>
        </ol>
      </section>

      {/* ── The builder ─────────────────────────────────────────────────── */}
      <BulkBuilder products={catalog} />

      {/* ── Why bulk ────────────────────────────────────────────────────── */}
      <section className="bg-white">
        <div className={cn(CONTAINER, "py-14")}>
          <Kicker>{bulkCopy.home.eyebrow}</Kicker>
          <h2
            className={cn(
              SERIF,
              "mt-1.5 mb-6 text-[clamp(24px,3vw,32px)] tracking-[-0.01em] text-navy-ink"
            )}
          >
            {bulkCopy.home.heading}
          </h2>
          <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-4">
            {bulkCopy.benefits.map((benefit) => (
              <li
                key={benefit.title}
                className="rounded-[14px] border border-rule bg-mist p-5"
              >
                <h3 className="mb-1.5 text-[16px] font-extrabold text-navy-ink">
                  {benefit.title}
                </h3>
                <p className="text-[14px] leading-[1.55] text-steel-ink">
                  {benefit.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className={cn(CONTAINER, "py-14")}>
        <h2
          className={cn(
            SERIF,
            "mb-6 text-[clamp(24px,3vw,32px)] tracking-[-0.01em] text-navy-ink"
          )}
        >
          {bulkCopy.faq.heading}
        </h2>
        <ul className="grid gap-3">
          {bulkCopy.faq.items.map((item) => (
            <li
              key={item.q}
              className="rounded-[14px] border border-rule bg-white"
            >
              <details className="group">
                <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-[16px] font-extrabold text-navy-ink marker:content-none">
                  {item.q}
                  <span
                    aria-hidden="true"
                    className="text-[20px] leading-none font-normal text-cobalt transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="px-5 pb-4 text-[15px] leading-[1.6] text-steel-ink">
                  {item.a}
                </p>
              </details>
            </li>
          ))}
        </ul>

        <p className="mt-8 rounded-[14px] border border-rule bg-white px-5 py-4 text-[13px] leading-[1.55] font-semibold text-steel-ink">
          {compliance.footerNote}
        </p>
      </section>

      <BulkQuoteForm />
      <CtaBand />
    </main>
  );
}
