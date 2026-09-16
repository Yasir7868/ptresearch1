/**
 * lib/format.ts — the ONE shared money formatter for the whole site.
 *
 * All money in this repo is INTEGER MINOR UNITS (cents for USD, per the
 * WC Store API convention). Every surface (home, catalog, PDP, cart,
 * checkout) formats through here; call sites render the output in
 * a code font (`.data-mono` / `font-mono` resolve to Satoshi tabular).
 *
 * The per-surface helpers (components/home/format.ts, components/pdp/money.ts,
 * components/checkout/money.ts, components/catalog/format.ts) are thin
 * re-exports kept for import stability — new code should import from here.
 */

/**
 * Format integer minor units as USD, e.g.
 *   formatMinor(8900)     -> "$89.00"
 *   formatMinor(123450)   -> "$1,234.50"
 *
 * @param minor      Amount in minor units (cents for USD).
 * @param minorUnit  Decimal places of the currency (USD = 2).
 */
export function formatMinor(minor: number, minorUnit: number = 2): string {
  const major = minor / 10 ** minorUnit;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: minorUnit,
    maximumFractionDigits: minorUnit,
  }).format(major);
}
