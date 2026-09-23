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

/** Render one amount, or a low–high span, as the live store prints it. */
function formatSpan(values: number[], minorUnit: number): string {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return min === max
    ? formatMinor(min, minorUnit)
    : `${formatMinor(min, minorUnit)} – ${formatMinor(max, minorUnit)}`;
}

/**
 * Price line for a product as the live store prints it: "$74.00" for a simple
 * product, "$59.00 – $274.00" across a variable product's sizes.
 */
export function formatPriceRange(
  product: {
    priceMinor: number;
    currencyMinorUnit: number;
    variations?: readonly { priceMinor: number }[];
  }
): string {
  const mu = product.currencyMinorUnit;
  const prices = (product.variations ?? []).map((v) => v.priceMinor);
  if (prices.length === 0) return formatMinor(product.priceMinor, mu);
  return formatSpan(prices, mu);
}

// ---------------------------------------------------------------------------
// Sale pricing
// ---------------------------------------------------------------------------

/** What a product costs right now, plus its pre-sale list price when lower. */
export interface PriceLine {
  /** What the researcher pays: "$79.00", or "$59.00 – $274.00". */
  price: string;
  /** Pre-sale list price in the same shape — null when not discounted. */
  regular: string | null;
  /** Whole-number percent saved on the entry price — null when not discounted. */
  percentOff: number | null;
}

/** Minimal shape `priceLine` reads; `Product` satisfies it structurally. */
export interface PricedProduct {
  priceMinor: number;
  regularPriceMinor?: number;
  currencyMinorUnit: number;
  variations?: readonly { priceMinor: number; regularPriceMinor?: number }[];
}

/**
 * The full price line for a card or buy panel.
 *
 * WooCommerce discounts are per-variation, so for a variable product the
 * percentage is quoted against the ENTRY size (the one whose price the
 * "from" figure shows) rather than mixing the cheapest sale price with an
 * unrelated size's list price. A list price at or below the live price is
 * treated as "not on sale" — that is how a stale `regular_price` of 0 (the
 * unpriced SKUs on the live store) reaches us.
 */
export function priceLine(product: PricedProduct): PriceLine {
  const mu = product.currencyMinorUnit;
  const variations = product.variations ?? [];
  const price = formatPriceRange(product);

  // Entry size = the variation the "from" price comes from.
  const entry = variations.length
    ? variations.reduce((lo, v) => (v.priceMinor < lo.priceMinor ? v : lo))
    : { priceMinor: product.priceMinor, regularPriceMinor: product.regularPriceMinor };

  const pay = entry.priceMinor;
  const list = entry.regularPriceMinor ?? pay;
  if (list <= pay || pay <= 0) return { price, regular: null, percentOff: null };

  const regulars = variations.length
    ? variations.map((v) => v.regularPriceMinor ?? v.priceMinor)
    : [list];

  return {
    price,
    regular: formatSpan(regulars, mu),
    percentOff: Math.round(((list - pay) / list) * 100),
  };
}
