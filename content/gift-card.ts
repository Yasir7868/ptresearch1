/**
 * content/gift-card.ts — the PT Research Digital Gift Card, exactly as the
 * live store publishes it.
 *
 * WHY THIS IS HARD-CODED (like content/taxonomy.ts): the gift card is a
 * `variable-advanced_gift_card` product (Advanced Gift Cards for WooCommerce).
 * The Store API reports it as `is_purchasable: false` with `prices.price: "0"`
 * and an EMPTY `variations[]` array — the plugin never exposes its tiers there.
 * The real tier list, ids, artwork and custom-amount rules are only published
 * in the product page's inline `agcfwVariableProduct` payload, which is where
 * every value below was harvested from (live, verified 2026-09-21):
 *
 *   product 6498 "PT Research Digital Gift Card"
 *   /product/pt-research-digital-gift-card/  (nav: /digtal-gift-card/)
 *   tiers 6501–6506 at $25 / $50 / $100 / $250 / $500 / $1,000, default $100
 *   every tier: giftable, delivery date allowed, no expiry, sold individually
 *   the $25 tier alone accepts a CUSTOM amount: $25–$1,000 in $1 steps
 *
 * Because the catalog hides the gift card (lib/woo/catalog.ts → isListable
 * drops unpurchasable zero-price products), nothing here flows through the
 * catalog mapper — this module is the single source of truth for /gift-card.
 *
 * Money is INTEGER MINOR UNITS (cents) everywhere, as in lib/cart.tsx and the
 * WC Store API. Artwork is vendored into public/images/gift-card/ rather than
 * hot-linked: the live host returns sporadic 500s and the build prerenders.
 *
 * Copy lives in content/site-copy.ts (giftCardCopy) — never here.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * The custom-amount rules a tier can carry (the plugin's "manual amount"
 * mode). All bounds in minor units. Live, only the $25 tier has this.
 */
export interface ManualAmountRule {
  /** Smallest accepted amount, in minor units. Live: $25. */
  minMinor: number;
  /** Largest accepted amount, in minor units. Live: $1,000. */
  maxMinor: number;
  /** The amount must sit on this increment above `minMinor`. Live: $1. */
  stepMinor: number;
  /** Prefilled value, in minor units. Live: $25. */
  defaultMinor: number;
}

/** One face value of the gift card — a WooCommerce variation. */
export interface GiftCardTier {
  /** WooCommerce variation id (6501–6506 live) — carried onto the cart line. */
  variationId: number;
  /**
   * The `attribute_amount` term WooCommerce keys this variation by ("100").
   * This is the <select> option value, exactly as live.
   */
  value: string;
  /** Face value in minor units. */
  amountMinor: number;
  /** Card artwork for this tier (1200×900), vendored from the live store. */
  image: string;
  /** Present only on a tier that accepts a custom amount (live: $25). */
  manualAmount?: ManualAmountRule;
}

// ---------------------------------------------------------------------------
// The product
// ---------------------------------------------------------------------------

const DOLLAR = 100;

/** The six published face values, in live order. `default: 100` is preselected. */
export const GIFT_CARD_TIERS: readonly GiftCardTier[] = [
  {
    variationId: 6501,
    value: "25",
    amountMinor: 25 * DOLLAR,
    image: "/images/gift-card/pt-gift-card-25.png",
    // Live: manual_amount_enabled "yes", min 25, max 1000, step 1, default 25.
    manualAmount: {
      minMinor: 25 * DOLLAR,
      maxMinor: 1000 * DOLLAR,
      stepMinor: 1 * DOLLAR,
      defaultMinor: 25 * DOLLAR,
    },
  },
  {
    variationId: 6502,
    value: "50",
    amountMinor: 50 * DOLLAR,
    image: "/images/gift-card/pt-gift-card-50.png",
  },
  {
    variationId: 6503,
    value: "100",
    amountMinor: 100 * DOLLAR,
    image: "/images/gift-card/pt-gift-card-100.png",
  },
  {
    variationId: 6504,
    value: "250",
    amountMinor: 250 * DOLLAR,
    image: "/images/gift-card/pt-gift-card-250.png",
  },
  {
    variationId: 6505,
    value: "500",
    amountMinor: 500 * DOLLAR,
    image: "/images/gift-card/pt-gift-card-500.png",
  },
  {
    variationId: 6506,
    value: "1000",
    amountMinor: 1000 * DOLLAR,
    image: "/images/gift-card/pt-gift-card-1000.png",
  },
];

export const giftCard = {
  /** WooCommerce parent product id — carried onto the cart line for the Woo adapter. */
  productId: 6498,
  /** The live product slug (/product/pt-research-digital-gift-card/). */
  slug: "pt-research-digital-gift-card",
  /**
   * Cart identity. The live product has NO sku; the cart keys lines by
   * `${sku}__${dose}` (lib/cart.tsx), so the gift card carries this stable
   * internal code instead of an empty string.
   */
  sku: "PT-GIFT-CARD",
  /** The live product name (not a GLP compound — no mapper coding applies). */
  name: "PT Research Digital Gift Card",
  /** The tier preselected on load, as live (`default: true` on the 100 term). */
  defaultTierValue: "100",
  /**
   * The buy form's DOM id. The page's fixed bottom bar sits outside the form,
   * so its Add to cart submits by `form=` rather than a synthetic click on the
   * real button (which is what live's script does).
   */
  formId: "gift-card-form",
  /**
   * How far ahead a delivery date may be scheduled. Live publishes an absolute
   * `max_delivery_timestamp` one year out and slides it forward, so the rule is
   * a rolling 365 days rather than a fixed date.
   */
  maxDeliveryDays: 365,
  /** Live: `is_sold_individually: "yes"`, `max_qty: 1` on every tier. */
  soldIndividually: true,
  /**
   * Coupons do not discount a gift card (owner's decision, 2026-09-21): a card
   * keeps its full face value, so 25% off one sells store credit below par.
   * The cart applies this (lib/cart.tsx → computeLocalTotals); WooCommerce
   * must carry the matching exclusion on the PT25 coupon, or the server
   * totals will disagree once the Woo cart adapter replaces the local math.
   */
  excludedFromCoupons: true,
  tiers: GIFT_CARD_TIERS,
} as const;

/** The tier for a `<select>` value, or undefined for "Choose an option". */
export function tierFor(value: string): GiftCardTier | undefined {
  return GIFT_CARD_TIERS.find((t) => t.value === value);
}

// ---------------------------------------------------------------------------
// Custom-amount parsing + validation
// ---------------------------------------------------------------------------

/**
 * Parse a typed amount ("250", "37.50") to minor units, or null when it is not
 * a finite number. Rounds to the nearest cent so float input cannot drift.
 */
export function parseAmountToMinor(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === "") return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * DOLLAR);
}

/**
 * Print an amount the way the gift card plugin prints its bounds: currency
 * symbol, no thousands separator, trailing zeros trimmed — "$25", "$1000",
 * "$1". Deliberately NOT lib/format.ts `formatMinor` (which would render
 * "$1,000.00"): these strings fill the live placeholder and the live error
 * messages, which are built this way.
 */
export function formatBound(minor: number): string {
  const major = (minor / DOLLAR).toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return `$${major}`;
}

/** The custom-amount field's placeholder, as live builds it: "$25–$1000". */
export function manualAmountPlaceholder(rule: ManualAmountRule): string {
  return `${formatBound(rule.minMinor)}–${formatBound(rule.maxMinor)}`;
}

/** Which validation message a custom amount fails on, if any. */
export type ManualAmountError =
  | { kind: "empty" }
  | { kind: "nonNumeric" }
  | { kind: "belowMin"; bound: string }
  | { kind: "aboveMax"; bound: string }
  | { kind: "offStep"; bound: string };

/**
 * Validate a typed custom amount against a tier's rules, in the plugin's own
 * order: empty → non-numeric → below min → above max → off step. Returns null
 * when the amount is acceptable.
 *
 * All comparisons are integer (minor units), so the plugin's float epsilon
 * fudge for the step check is not needed here.
 */
export function validateManualAmount(
  text: string,
  rule: ManualAmountRule
): ManualAmountError | null {
  if (text.trim() === "") return { kind: "empty" };

  const minor = parseAmountToMinor(text);
  if (minor === null) return { kind: "nonNumeric" };

  if (minor < rule.minMinor) {
    return { kind: "belowMin", bound: formatBound(rule.minMinor) };
  }
  if (minor > rule.maxMinor) {
    return { kind: "aboveMax", bound: formatBound(rule.maxMinor) };
  }
  if (rule.stepMinor > 0 && (minor - rule.minMinor) % rule.stepMinor !== 0) {
    return { kind: "offStep", bound: formatBound(rule.stepMinor) };
  }
  return null;
}
