/**
 * GuaranteeNote — the falsifiable-guarantee framing near the buy zone
 * (JUDGE-PANEL GRAFT #6, DESIGN §9.4).
 *
 * Terms §8 carries a real, testable promise: replacement/refund if valid
 * third-party testing proves a product below its COA spec, within 30 days.
 * We surface that clause VERBATIM (single-sourced from content/site-copy.ts —
 * never retyped here), add exactly ONE framing line, and link /terms. No
 * invented terms; if the clause ever leaves the copy inventory this renders
 * nothing rather than paraphrase.
 *
 * Server Component.
 */

import Link from "next/link";
import { termsHtmlSections } from "@/content/site-copy";

const clause = termsHtmlSections
  .flatMap((section) => section.blocks)
  .find((block) => block.text.startsWith("Exception — Purity Guarantee"))?.text;

export function GuaranteeNote() {
  if (!clause) return null;

  return (
    <aside
      aria-label="Purity guarantee"
      className="border-l-2 border-green py-1 pl-4"
    >
      <p className="micro-label">Purity guarantee — Terms §8</p>
      {/* One framing line: this is a promise a skeptic can test. */}
      <p className="mt-2 text-sm leading-relaxed text-ink">
        This is a promise you can test — any batch can be independently
        verified against its certificate.
      </p>
      <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">
        {clause}
      </p>
      <Link
        href="/terms"
        className="mt-2 inline-block text-sm text-green underline-offset-3 transition-colors hover:text-green-deep hover:underline"
      >
        Read the full terms
      </Link>
    </aside>
  );
}
