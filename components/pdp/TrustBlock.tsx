/**
 * TrustBlock — the PDP's trust spine, staged FIRST and BIGGEST (DESIGN §8.3).
 * Purity resolves ABOVE price, on purpose. Server Component; the only client
 * leaf is the amber TickRule under the trophy numeral.
 *
 * Three honest states:
 *  1. CERT-BACKED — the measured purity as a poster-scale Satoshi trophy
 *     numeral (static, no count-up) with the amber tick-underline, the earned
 *     VerifiedMark + method line, Purity/Endotoxin certificate buttons, and
 *     the batch reference in tabular Satoshi.
 *  2. PENDING — no certificate published: the spec figure "≥98% (spec)" in a
 *     deliberately SMALL data treatment + "Certificate pending". No trophy,
 *     no VerifiedMark, no fake numeral — refusing to fabricate is the
 *     credibility signal (DESIGN §9.3).
 *  3. LAB SUPPLY — bacteriostatic water is not a lyophilized peptide: a quiet
 *     Grade/Form record, no HPLC purity claim at all.
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VerifiedMark } from "@/components/plate/VerifiedMark";
import { TickRule } from "@/components/pdp/TickRule";
import type { PdpCoaRecord } from "@/components/pdp/coa-data";

/** Split "99.28%" into numeral + unit so the % can be optically reduced. */
function splitPurity(purity: string): { value: string; pct: boolean } {
  const m = /^(\d+(?:\.\d+)?)\s*%$/.exec(purity.trim());
  return m ? { value: m[1], pct: true } : { value: purity, pct: false };
}

export function TrustBlock({
  coa,
  isLabSupply,
}: {
  /** Full certificate record — null when no COA is published. */
  coa: PdpCoaRecord | null;
  isLabSupply: boolean;
}) {
  // ── 3. Lab supplies: honest Grade/Form record, no purity claim ──────────
  if (isLabSupply) {
    return (
      <section aria-label="Specification" className="soft-card overflow-hidden">
        <p className="micro-label hairline-b px-4 py-2.5">Specification</p>
        <dl className="divide-y divide-hairline">
          <div className="flex items-baseline justify-between gap-4 px-4 py-3">
            <dt className="micro-label shrink-0">Grade</dt>
            <dd className="data-num text-sm text-green">USP</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 px-4 py-3">
            <dt className="micro-label shrink-0">Form</dt>
            <dd className="text-sm text-ink">Sterile solution</dd>
          </div>
        </dl>
      </section>
    );
  }

  // ── 2. No published certificate: the honest pending state ───────────────
  if (!coa) {
    return (
      <section aria-label="Purity specification" className="flex flex-col gap-2">
        <p className="micro-label">Purity specification</p>
        <p className="data-num text-[1.75rem] leading-none text-ink">
          ≥98% <span className="font-normal text-ink-muted">(spec)</span>
        </p>
        <p className="text-sm text-ink-muted">
          Certificate pending —{" "}
          <Link
            href="/coa"
            className="text-green underline-offset-3 transition-colors hover:text-green-deep hover:underline"
          >
            see the Lab Results library
          </Link>
        </p>
      </section>
    );
  }

  // ── 1. Cert-backed: the trophy numeral — the credibility object ─────────
  const { value, pct } = splitPurity(coa.purity);

  return (
    <section aria-label="Verified purity" className="flex flex-col gap-3">
      <p className="micro-label">Measured purity</p>

      {/* Static by spec — never count-up. The only motion is the tick draw. */}
      <p className="trophy-num text-[clamp(3.75rem,7vw,6.25rem)]">
        {value}
        {pct && <span className="trophy-pct">%</span>}
      </p>
      <TickRule />

      {/* Earned mark + verbatim method line (DESIGN §9.2) */}
      <p className="flex flex-wrap items-center">
        <VerifiedMark label="Third-party verified" />
        <span className="batch-tick" aria-hidden="true">
          ·
        </span>
        <span className="micro-label">HPLC + Mass Spectrometry</span>
      </p>

      {/* Certificate documents — the proof, one click away */}
      <div className="mt-1 flex flex-wrap gap-2.5">
        <Button
          asChild
          variant="outline"
          className="h-9 border-green/45 bg-transparent px-4 text-green hover:bg-green hover:text-primary-foreground"
        >
          <a href={coa.coaUrl} target="_blank" rel="noopener noreferrer">
            Purity Certificate (PDF)
          </a>
        </Button>
        {coa.endotoxinUrl && (
          <Button
            asChild
            variant="outline"
            className="h-9 border-green/45 bg-transparent px-4 text-green hover:bg-green hover:text-primary-foreground"
          >
            <a href={coa.endotoxinUrl} target="_blank" rel="noopener noreferrer">
              Endotoxin Certificate (PDF)
            </a>
          </Button>
        )}
      </div>

      {/* Batch reference — real PTR token from the published cert filename */}
      <p className="batch-id text-ink-muted">
        <span className="sr-only">Certificate reference: </span>
        {coa.batchRef && (
          <>
            {coa.batchRef}
            <span className="batch-tick" aria-hidden="true">
              ·
            </span>
          </>
        )}
        {coa.label}
      </p>
    </section>
  );
}
