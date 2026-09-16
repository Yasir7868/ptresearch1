/**
 * components/pdp/coa-data.ts — the PDP's join onto the FULL certificate
 * records in content/coa-map.json (+ the page-1 thumbnail manifest).
 *
 * The catalog mapper only enriches Product with `purity` + `coaUrl`; the PDP
 * trust architecture (DESIGN §8/§9 + grafts #1/#7) also needs the certificate
 * LABEL, the endotoxin PDF, the batch reference, and the rendered page-1
 * thumbnail. Every real coa-map record carries a numeric `productId`, so we
 * index by that — the one reliable join key (map keys are heterogeneous:
 * sku-ish, slug, or coded label).
 *
 * HONESTY RULES (graft #7 / #11):
 *  - Only fields that literally exist in coa-map.json are surfaced. No dates,
 *    no invented values, no "corrections" of the known client mislabels
 *    (_meta.data_quality_flags) — we present what the live store publishes.
 *  - `batchRef` is the PTR-XXXXXXX token parsed from the published purity-
 *    certificate FILENAME (real data, e.g. PTR-3664990). Certificates whose
 *    filename carries no PTR token get no batchRef — omitted, never invented.
 *  - GLP HARD RULE: labels/URLs in the map are already coded (GLP1-SM /
 *    GLP2-TZ / GLP3-RT); they pass through verbatim, never expanded.
 */

import coaMapRaw from "@/content/coa-map.json";
import coaThumbs from "@/content/coa-thumbs.json";

export interface PdpCoaRecord {
  /** Certificate label as published (already GLP-coded), e.g. "BPC-157". */
  label: string;
  /** Measured HPLC purity from the published certificate, e.g. "99.28%". */
  purity: string;
  /** Purity-certificate PDF (the primary COA). */
  coaUrl: string;
  /** Separate endotoxin-certificate PDF, when the store publishes one. */
  endotoxinUrl?: string;
  /** PTR-XXXXXXX parsed from the purity-cert filename; absent when the file carries none. */
  batchRef?: string;
  /** Local page-1 render of the purity certificate (content/coa-thumbs.json), when available. */
  thumb?: string;
}

interface RawCoaRecord {
  coaUrl?: string;
  purity?: string;
  label?: string;
  endotoxinUrl?: string;
  productId?: number;
}

const THUMBS = coaThumbs as Record<string, string>;

const byProductId = new Map<number, PdpCoaRecord>();

for (const [key, value] of Object.entries(coaMapRaw as Record<string, unknown>)) {
  if (key.startsWith("_")) continue; // _meta / _unmatched
  const rec = value as RawCoaRecord;
  if (typeof rec.productId !== "number" || !rec.coaUrl || !rec.purity) continue;

  const filename = rec.coaUrl.split("/").pop() ?? "";
  const batchRef = /PTR-\d+/.exec(filename)?.[0];
  const thumb = THUMBS[key];

  byProductId.set(rec.productId, {
    label: rec.label ?? "",
    purity: rec.purity,
    coaUrl: rec.coaUrl,
    ...(rec.endotoxinUrl ? { endotoxinUrl: rec.endotoxinUrl } : {}),
    ...(batchRef ? { batchRef } : {}),
    ...(thumb ? { thumb } : {}),
  });
}

/** Full certificate record for a product, or null when none is published. */
export function getCoaRecord(productId: number): PdpCoaRecord | null {
  return byProductId.get(productId) ?? null;
}
