/**
 * coa-lookup — client-safe "does this cart line have a real COA?" check.
 *
 * The earned verified mark (D3 trust graft #2) renders ONLY where a real
 * third-party COA PDF exists — its absence carries meaning. Cart lines carry
 * the Woo productId, so this module builds a Set of productIds from
 * content/coa-map.json (the 14 real certificates) at module load. Static
 * JSON — no network, safe in client components. `_meta` / `_unmatched`
 * bookkeeping keys are skipped.
 */
import coaMapJson from "@/content/coa-map.json";

const VERIFIED_PRODUCT_IDS: ReadonlySet<number> = (() => {
  const ids = new Set<number>();
  for (const [key, value] of Object.entries(
    coaMapJson as Record<string, unknown>
  )) {
    if (key.startsWith("_")) continue; // _meta / _unmatched bookkeeping
    if (typeof value !== "object" || value === null) continue;
    const entry = value as { productId?: unknown; coaUrl?: unknown };
    if (
      typeof entry.productId === "number" &&
      typeof entry.coaUrl === "string" &&
      entry.coaUrl.length > 0
    ) {
      ids.add(entry.productId);
    }
  }
  return ids;
})();

/** True only when the product has a real, published third-party COA PDF. */
export function hasVerifiedCoa(productId: number | undefined): boolean {
  return productId !== undefined && VERIFIED_PRODUCT_IDS.has(productId);
}
