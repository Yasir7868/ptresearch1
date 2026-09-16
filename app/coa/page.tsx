import type { Metadata } from "next";
import Link from "next/link";
import { getCatalog } from "@/lib/woo/catalog";
import { faqItems, termsHtmlSections } from "@/content/site-copy";
import coaMapRaw from "@/content/coa-map.json";
import coaThumbs from "@/content/coa-thumbs.json";
import { pageMetadata } from "@/components/static/page-meta";
import { PageHeader } from "@/components/static/PageHeader";
import {
  CoaLibraryView,
  type CertCard,
  type PendingRow,
} from "@/components/static/CoaLibraryView";
import type { CoaRow } from "@/components/static/CoaLibraryTable";
import { FadeIn } from "@/components/motion/FadeIn";
import { InkWipe } from "@/components/motion/InkWipe";

export const metadata: Metadata = pageMetadata({
  title: "Lab Results",
  description:
    "The certificate library for the Primetime Research catalog — measured HPLC/Mass-Spectrometry purity per batch, page-one certificate scans, and every PDF, in one place.",
  path: "/coa",
});

// ── Join: catalog products → published COA certificates ─────────────────────
// coa-map.json mixes real certificate records with `_meta`/`_unmatched` keys.
// Every real record carries a numeric `productId` (primary join) and a unique
// coaUrl (fallback join for products the catalog mapper already enriched via
// sku/slug lookup). Thumbnails are keyed by the coa-map key itself.
//
// Graft #11 note: links point at exactly what the live store publishes.
// Known mislabels are documented in `_meta.data_quality_flags` for client
// intake — they are deliberately NOT corrected or surfaced here.
interface CoaRecord {
  coaUrl?: string;
  purity?: string;
  endotoxinUrl?: string;
  productId?: number;
}

const thumbByKey = coaThumbs as Record<string, string>;

interface JoinedCert {
  coaUrl: string;
  purity: string;
  endotoxinUrl?: string;
  thumbSrc?: string;
}

const certByProductId = new Map<number, JoinedCert>();
const certByCoaUrl = new Map<string, JoinedCert>();
for (const [key, value] of Object.entries(coaMapRaw as Record<string, unknown>)) {
  if (key === "_meta" || key === "_unmatched") continue;
  const rec = value as CoaRecord;
  if (!rec.coaUrl || !rec.purity) continue;
  const joined: JoinedCert = {
    coaUrl: rec.coaUrl,
    purity: rec.purity,
    endotoxinUrl: rec.endotoxinUrl,
    thumbSrc: thumbByKey[key],
  };
  if (typeof rec.productId === "number") {
    certByProductId.set(rec.productId, joined);
  }
  certByCoaUrl.set(rec.coaUrl, joined);
}

/** Batch id as printed in the certificate filename, e.g. "PTR-3664990". */
function batchFromUrl(url: string): string | undefined {
  return url.match(/PTR-\d+/)?.[0];
}

/** The verbatim purity-guarantee clause, sourced from Terms §8 — never retyped. */
const guaranteeClause = termsHtmlSections
  .find((s) => s.heading.includes("No Returns"))
  ?.blocks.find((b) => b.text.startsWith("Exception — Purity Guarantee"))?.text;

// ── "How to read a COA" (graft #3) — plain teaching copy, zero new claims ───
const READING_STEPS: { title: string; body: string }[] = [
  {
    title: "What a COA is",
    body: "A Certificate of Analysis is a lab report issued for one production batch. It records what that batch was tested for and what the instruments measured. It applies to that batch alone — not to a product line in general.",
  },
  {
    title: "The parts of a certificate",
    body: "Most certificates carry the same sections: the compound name, the batch or lot number, the test method, the specification the batch had to meet, and the measured result. The letterhead identifies the laboratory that ran the test.",
  },
  {
    title: "What HPLC purity means",
    body: "HPLC separates a sample into its components and measures how much of the total is the named compound. A result of 99.28% means 99.28% of the detected material is that compound. Mass spectrometry confirms the compound’s identity by its molecular weight.",
  },
  {
    title: "Matching batch to vial",
    body: "Compare the batch number on the certificate with the number printed on the vial label. When they match, the certificate describes the exact batch in your hand. If anything does not line up, contact support before proceeding.",
  },
];

export default async function CoaPage() {
  const products = await getCatalog();

  const certs: CertCard[] = [];
  const pending: PendingRow[] = [];
  const tableRows: CoaRow[] = [];

  for (const p of products) {
    const joined =
      certByProductId.get(p.productId) ??
      (p.coaUrl ? certByCoaUrl.get(p.coaUrl) : undefined) ??
      (p.coaUrl && p.purity ? { coaUrl: p.coaUrl, purity: p.purity } : undefined);

    if (joined) {
      certs.push({
        slug: p.slug,
        displayName: p.displayName,
        categoryName: p.categoryName,
        purity: joined.purity,
        coaUrl: joined.coaUrl,
        endotoxinUrl: joined.endotoxinUrl,
        batchId: batchFromUrl(joined.coaUrl),
        thumbSrc: joined.thumbSrc,
      });
    } else {
      pending.push({
        slug: p.slug,
        displayName: p.displayName,
        categoryName: p.categoryName,
      });
    }

    tableRows.push({
      slug: p.slug,
      displayName: p.displayName,
      categoryName: p.categoryName,
      purity: joined?.purity,
      coaUrl: joined?.coaUrl,
      endotoxinUrl: joined?.endotoxinUrl,
    });
  }

  // Real measured range across the published certificates — computed, never
  // hard-coded, so the figure can only ever say what the PDFs say.
  const purityValues = certs
    .map((c) => Number.parseFloat(c.purity))
    .filter((n) => Number.isFinite(n));
  const purityRange =
    purityValues.length > 0
      ? `${Math.min(...purityValues).toFixed(2)}%–${Math.max(...purityValues).toFixed(2)}%`
      : null;

  const purityFaq = faqItems.find(
    (f) => f.q === "What purity levels do you guarantee?"
  );
  const thirdPartyFaq = faqItems.find(
    (f) => f.q === "Are your peptides third-party tested?"
  );

  return (
    <main>
      {/* ── Opening: header + the real numbers ─────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-16 md:px-6 md:pt-24">
        <PageHeader
          label="Certificates of Analysis"
          title="Lab Results"
          sub="Measured purity, batch ids, and the certificate PDFs behind the catalog — the evidence, in one place."
        />

        <FadeIn className="mt-14">
          <div className="hairline-y grid grid-cols-1 divide-y divide-hairline sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="flex flex-col justify-between gap-3 py-6 sm:pr-8">
              <span className="data-num text-[2rem] leading-none text-green">
                {products.length}
              </span>
              <p className="micro-label">Compounds cataloged</p>
            </div>
            <div className="flex flex-col justify-between gap-3 py-6 sm:px-8">
              <span className="data-num text-[2rem] leading-none text-green">
                {certs.length}
              </span>
              <p className="micro-label">Compounds with published certificates</p>
            </div>
            <div className="flex flex-col justify-between gap-3 py-6 sm:pl-8">
              <span className="data-num text-[clamp(1.4rem,2.1vw,2rem)] leading-none text-green">
                {purityRange ?? "—"}
              </span>
              <p className="micro-label">Measured purity, across certificates</p>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── The wall of certificates (+ table toggle + pending index) ──── */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-24">
        <CoaLibraryView certs={certs} pending={pending} tableRows={tableRows} />
      </section>

      {/* ── How to read a COA — green chapter band (graft #3) ──────────── */}
      <InkWipe>
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
          <p className="micro-label-dark">Verification</p>
          <h2 className="mt-4 text-[clamp(1.9rem,3.4vw,3rem)]">
            How to read a COA
          </h2>
          <p className="mt-5 max-w-2xl text-[15.5px] leading-relaxed text-mint/90">
            A certificate is only useful if you can read it. Four things to
            check on any certificate — ours included.
          </p>

          <div className="mt-14 grid gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-4">
            {READING_STEPS.map((step, i) => (
              <div key={step.title} className="border-t border-mint/25 pt-6">
                <span
                  aria-hidden="true"
                  className="amber-display font-display text-[2.4rem] leading-none font-bold tracking-[-0.02em]"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-[1.25rem]">{step.title}</h3>
                <p className="mt-2.5 text-[14px] leading-relaxed text-mint/85">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </InkWipe>

      {/* ── The claim and its evidence, co-located (DESIGN §9.4–9.5) ───── */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
        <div className="grid gap-10 lg:grid-cols-2">
          <FadeIn className="h-full">
            <div className="plate h-full">
              <div className="plate-field h-full p-7 md:p-9">
                <p className="micro-label">The specification</p>
                {purityFaq ? (
                  <p className="mt-4 text-[15px] leading-relaxed text-ink">
                    {purityFaq.a}
                  </p>
                ) : null}
                {thirdPartyFaq ? (
                  <p className="mt-3 text-[14px] leading-relaxed text-ink-muted">
                    {thirdPartyFaq.a}
                  </p>
                ) : null}
              </div>
            </div>
          </FadeIn>

          <FadeIn className="h-full">
            <div className="plate h-full">
              <div className="plate-field h-full p-7 md:p-9">
                <p className="micro-label">The purity guarantee</p>
                <p className="mt-4 text-[15px] leading-relaxed text-ink">
                  A promise you can test: verify a batch with your own
                  third-party lab, and the Terms state the remedy in writing.
                </p>
                {guaranteeClause ? (
                  <blockquote className="mt-4 border-l-2 border-green pl-4 text-[14px] leading-relaxed text-ink-muted">
                    {guaranteeClause}
                  </blockquote>
                ) : null}
                <Link
                  href="/terms"
                  className="mt-5 inline-flex items-center text-sm font-medium text-green underline decoration-hairline underline-offset-4 transition-colors hover:text-green-deep hover:decoration-green"
                >
                  Read it in the Terms
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </main>
  );
}
