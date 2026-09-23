/**
 * lib/admin/money.ts — money for the admin panel. Client-safe.
 *
 * Same convention as the storefront (lib/format.ts): integer minor units
 * internally. WooCommerce sends decimal strings (wc/v3) or floats
 * (wc-analytics); both are converted once, at the edge, with toMinor().
 */

export function toMinor(value: string | number | null | undefined, decimals = 2): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.round(n * 10 ** decimals) : 0;
}

/** "12.30" — the decimal string WooCommerce expects on writes. */
export function toDecimalString(minor: number, decimals = 2): string {
  return (minor / 10 ** decimals).toFixed(decimals);
}

const formatters = new Map<string, Intl.NumberFormat>();

export function formatMoney(minor: number, currency = "USD", decimals = 2): string {
  const key = `${currency}:${decimals}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    } catch {
      formatter = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    }
    formatters.set(key, formatter);
  }
  return formatter.format(minor / 10 ** decimals);
}

/** "$12.9K" — compact figures for stat tiles and chart axes. */
export function formatMoneyCompact(minor: number, currency = "USD", decimals = 2): string {
  const major = minor / 10 ** decimals;
  if (Math.abs(major) < 10_000) return formatMoney(Math.round(major), currency, 0);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(major);
  } catch {
    return formatMoney(minor, currency, decimals);
  }
}

export function formatCount(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}
