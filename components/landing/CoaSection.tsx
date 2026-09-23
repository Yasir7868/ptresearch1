/**
 * CoaSection (#coa) — "3rd party tested": the live "No exceptions. No
 * shortcuts." assurance as the headline, three testing facts, and a batch
 * lookup (GET → /coa?q=…, which the COA library filters by name or batch
 * number) beside the vials photograph with a verified-batch card.
 *
 * The batch card is REAL data: one product's published certificate from
 * content/coa-map.json (batch label + measured purity). The design's sample
 * lot number and figure are not used. No certificate → no card.
 * Server component (next/form is its own client leaf).
 */

import Form from "next/form";
import Image from "next/image";
import type { Product } from "@/lib/woo/types";
import coaMapRaw from "@/content/coa-map.json";
import { redesignHome } from "@/content/site-copy";
import { formatPurity } from "@/components/catalog/format";
import { Arrow, CONTAINER, Kicker, SERIF } from "./parts";
import { cn } from "@/lib/utils";

const copy = redesignHome.coa;

interface CoaRecord {
  label?: string;
  purity?: string;
  productId?: number;
}

interface Batch {
  name: string;
  lot: string;
  purity: string;
}

/** The certificate coa-map.json holds for this product, if any. */
function batchFor(product: Product): Batch | null {
  for (const [key, value] of Object.entries(
    coaMapRaw as Record<string, unknown>
  )) {
    if (key.startsWith("_")) continue;
    const record = value as CoaRecord;
    if (record.productId !== product.productId && key !== product.slug) continue;
    const purity = formatPurity(record.purity);
    if (!record.label || !purity) return null;
    return {
      name: [product.displayName, product.size].filter(Boolean).join(" "),
      lot: record.label,
      purity,
    };
  }
  return null;
}

export function CoaSection({ products }: { products: Product[] }) {
  const featured = products.find((p) => p.slug === copy.featuredSlug);
  const batch = featured ? batchFor(featured) : null;

  return (
    <section id="coa" className="scroll-mt-[69px] border-y border-rule bg-white">
      <div
        className={cn(
          CONTAINER,
          "grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] items-center gap-10 py-16"
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
          <p className="mb-6 text-[16px] leading-[1.65] text-steel-ink">
            {copy.body}
          </p>

          <ul className="mb-7 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
            {copy.checks.map((check) => (
              <li key={check.title} className="rounded-[12px] bg-mist p-3.5">
                <p className="text-[15px] font-extrabold">{check.title}</p>
                <p className="text-[13px] text-steel">{check.body}</p>
              </li>
            ))}
          </ul>

          <Form action="/coa" role="search" className="flex flex-wrap gap-2.5">
            <label className="flex h-12 min-w-[200px] flex-1 items-center rounded-lg border border-rule bg-mist px-3 transition-colors focus-within:border-cobalt">
              <span className="sr-only">{copy.batchLabel}</span>
              <input
                type="search"
                name="q"
                placeholder={
                  batch ? copy.batchPlaceholder(batch.lot) : copy.batchLabel
                }
                className="w-full border-0 bg-transparent text-[14px] text-navy-ink outline-none placeholder:text-steel focus-visible:outline-none"
              />
            </label>
            <button
              type="submit"
              className="inline-flex h-12 cursor-pointer items-center gap-1.5 rounded-lg bg-navy px-5 text-[15px] font-bold text-white transition-colors hover:bg-cobalt"
            >
              {copy.findCoa} <Arrow />
            </button>
          </Form>
        </div>

        <div className="relative">
          <Image
            src="/images/home/vials-trio.webp"
            alt={copy.imageAlt}
            width={690}
            height={570}
            sizes="(min-width: 1240px) 576px, (min-width: 700px) 50vw, 100vw"
            className="block aspect-[4/3] w-full rounded-xl object-cover"
          />
          {batch ? (
            <div className="absolute inset-x-4 bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-[12px] bg-[rgba(6,20,40,.88)] px-4 py-3.5 text-white backdrop-blur-[6px]">
              <div>
                <p className="text-[12px] font-bold tracking-[0.1em] text-haze uppercase">
                  {copy.featuredLabel}
                </p>
                <p className="font-extrabold">
                  {batch.name} ·{" "}
                  <span className="whitespace-nowrap">
                    {copy.lotPrefix} {batch.lot}
                  </span>
                </p>
              </div>
              <p className="text-[22px] font-extrabold text-azure tabular-nums">
                {batch.purity}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
