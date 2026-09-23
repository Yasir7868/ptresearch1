/**
 * TrustBlock — the PDP's trust spine, staged FIRST and BIGGEST (DESIGN §8.3).
 * Purity resolves ABOVE price, on purpose. Server Component; the only client
 * leaf is the amber TickRule under the trophy numeral.
 *
 * Renders only for CERT-BACKED products: the measured purity from the
 * published certificate as a poster-scale Satoshi trophy numeral (static, no
 * count-up) with the amber tick-underline, the earned VerifiedMark, the live
 * FAQ's method wording, the Purity / Endotoxin certificate buttons, and the
 * batch reference in tabular Satoshi. Products without a published
 * certificate render nothing — no fabricated or "spec" figure.
 */

import { Button } from "@/components/ui/button";
import { VerifiedMark } from "@/components/plate/VerifiedMark";
import { TickRule } from "@/components/pdp/TickRule";
import type { PdpCoaRecord } from "@/components/pdp/coa-data";
import { coaPage, heroCopy } from "@/content/site-copy";

/** Split "99.28%" into numeral + unit so the % can be optically reduced. */
function splitPurity(purity: string): { value: string; pct: boolean } {
  const m = /^(\d+(?:\.\d+)?)\s*%$/.exec(purity.trim());
  return m ? { value: m[1], pct: true } : { value: purity, pct: false };
}

/** Method wording from the live FAQ: "tested using HPLC and Mass Spectrometry". */
const METHOD = "HPLC and Mass Spectrometry";

export function TrustBlock({
  coa,
}: {
  /** Full certificate record — null when no COA is published. */
  coa: PdpCoaRecord | null;
}) {
  if (!coa) return null;

  const { value, pct } = splitPurity(coa.purity);

  return (
    <section aria-label={heroCopy.trustStat.label} className="flex flex-col gap-3">
      <p className="micro-label">{heroCopy.trustStat.label}</p>

      {/* Static by spec — never count-up. The only motion is the tick draw. */}
      <p className="trophy-num text-[clamp(3.75rem,7vw,6.25rem)]">
        {value}
        {pct && <span className="trophy-pct">%</span>}
      </p>
      <TickRule />

      {/* Earned mark + method line (DESIGN §9.2) */}
      <p className="flex flex-wrap items-center">
        <VerifiedMark />
        <span className="batch-tick" aria-hidden="true">
          ·
        </span>
        <span className="micro-label">{METHOD}</span>
      </p>

      {/* Certificate documents — the proof, one click away */}
      <div className="mt-1 flex flex-wrap gap-2.5">
        <Button
          asChild
          variant="outline"
          className="h-9 border-green/45 bg-transparent px-4 text-green hover:bg-green hover:text-primary-foreground"
        >
          <a href={coa.coaUrl} target="_blank" rel="noopener noreferrer">
            {coaPage.purityCertificate}
          </a>
        </Button>
        {coa.endotoxinUrl && (
          <Button
            asChild
            variant="outline"
            className="h-9 border-green/45 bg-transparent px-4 text-green hover:bg-green hover:text-primary-foreground"
          >
            <a href={coa.endotoxinUrl} target="_blank" rel="noopener noreferrer">
              {coaPage.endotoxinCertificate}
            </a>
          </Button>
        )}
      </div>

      {/* Batch reference — real PTR token from the published cert filename */}
      <p className="batch-id text-ink-muted">
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
