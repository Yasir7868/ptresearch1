/**
 * components/catalog/format.ts — display formatting for catalog data.
 *
 * MONEY RULE: all prices arrive as INTEGER MINOR UNITS (cents). This is the
 * shared formatter for the catalog surface — render its output as General
 * Sans tabular lining figures (`.data-num` / `.data-mono`), never a code font.
 *
 * Money formatting delegates to the site-wide canonical helper in
 * lib/format.ts; purity helpers stay catalog-scoped.
 */

import { formatMinor } from "@/lib/format";

/** "$249.99" from 24999 (minor units). Delegates to lib/format.ts. */
export function formatMinorPrice(minor: number, minorUnit: number = 2): string {
  return formatMinor(minor, minorUnit);
}

/**
 * Numeric purity for sorting. coa-map values look like "99.28%" (sometimes
 * without the sign) — parseFloat handles both. Null when absent/unparseable.
 */
export function purityValue(purity?: string): number | null {
  if (!purity) return null;
  const n = parseFloat(purity);
  return Number.isFinite(n) ? n : null;
}

/** Normalized display string, e.g. "99.28%" — never a doubled % sign. */
export function formatPurity(purity?: string): string | null {
  const n = purityValue(purity);
  return n === null ? null : `${n.toFixed(2)}%`;
}
