/**
 * CoaFacsimile — the typeset COA facsimile for cert-backed products
 * (JUDGE-PANEL GRAFT #7). A small ruled record card that restates ONLY the
 * fields we actually have: compound, certificate label, method (HPLC),
 * measured purity, and the PDF documents (endotoxin included when the store
 * publishes one). No dates, no invented values — the PDF stays authoritative.
 *
 * GRAFT #1: the real page-1 render of the purity certificate (from
 * content/coa-thumbs.json) sits beside the table as trust imagery, linking to
 * the PDF. The thumbnail is deliberately NOT duotoned — it is documentary
 * evidence, shown true (duotone is reserved for decorative vial contexts).
 *
 * Server Component — plain anchors, no client JS.
 */

import Image from "next/image";
import type { PdpCoaRecord } from "@/components/pdp/coa-data";

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-6 px-4 py-3">
      <dt className="micro-label shrink-0">{label}</dt>
      <dd className="text-right text-sm text-ink">{children}</dd>
    </div>
  );
}

export function CoaFacsimile({
  coa,
  compound,
}: {
  coa: PdpCoaRecord;
  /** Coded display name of the product (mapper output — GLP rule applied). */
  compound: string;
}) {
  return (
    <section aria-label="Certificate of analysis">
      <div className="soft-card overflow-hidden">
        <p className="micro-label hairline-b px-4 py-2.5">
          Certificate of analysis
        </p>

        <div className="flex">
          {/* Page-1 facsimile thumbnail — true color, links to the PDF */}
          {coa.thumb && (
            <a
              href={coa.coaUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open the ${coa.label} purity certificate PDF`}
              className="flex w-24 shrink-0 items-start border-r border-hairline p-3 transition-colors hover:bg-paper sm:w-28"
            >
              <Image
                src={coa.thumb}
                alt={`Certificate of analysis, page 1 — ${coa.label}`}
                width={640}
                height={905}
                sizes="112px"
                className="h-auto w-full rounded-md border border-hairline"
              />
            </a>
          )}

          <dl className="flex-1 divide-y divide-hairline">
            <Row label="Compound">
              <span className="font-display text-[1.05rem] leading-snug font-semibold tracking-[-0.01em]">
                {compound}
              </span>
            </Row>
            <Row label="Certificate">{coa.label}</Row>
            <Row label="Method">HPLC</Row>
            <Row label="Measured purity">
              <span className="data-num font-medium text-green">
                {coa.purity}
              </span>
            </Row>
            <Row label="Documents">
              <span className="flex flex-col items-end gap-1">
                <a
                  href={coa.coaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green underline-offset-3 transition-colors hover:text-green-deep hover:underline"
                >
                  Purity Certificate (PDF)
                </a>
                {coa.endotoxinUrl && (
                  <a
                    href={coa.endotoxinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green underline-offset-3 transition-colors hover:text-green-deep hover:underline"
                  >
                    Endotoxin Certificate (PDF)
                  </a>
                )}
              </span>
            </Row>
          </dl>
        </div>
      </div>

      <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink-muted">
        Typeset from the published certificate. The PDF is the authoritative
        document.
      </p>
    </section>
  );
}
