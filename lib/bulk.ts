/**
 * lib/bulk.ts — bulk-tier math. Pure, isomorphic, no React, no I/O.
 *
 * One implementation feeds three places, so the ladder can never disagree
 * with itself: the /bulk builder's live summary, the cart totals
 * (lib/cart.tsx), and anything server-side that needs to name the coupon
 * WooCommerce should be holding.
 *
 * Money is integer minor units (cents) throughout — same convention as
 * lib/cart.tsx and lib/woo/types.ts. Rounding matches the cart's existing
 * coupon math (`Math.floor`), which in turn matches WooCommerce's
 * percent-coupon behaviour of discounting down to the cent.
 */

import {
  bulkFreeShippingMinUnits,
  bulkQuoteThreshold,
  bulkTiers,
  type BulkTier,
} from "@/content/bulk";

/** Ascending copy of the ladder — content order is not trusted. */
const LADDER: BulkTier[] = [...bulkTiers].sort(
  (a, b) => a.minUnits - b.minUnits
);

/** The highest tier `units` has earned, or null below the first rung. */
export function tierForUnits(units: number): BulkTier | null {
  let earned: BulkTier | null = null;
  for (const tier of LADDER) {
    if (units >= tier.minUnits) earned = tier;
    else break;
  }
  return earned;
}

/** The next rung up, or null once the top tier is earned. */
export function nextTier(units: number): BulkTier | null {
  return LADDER.find((tier) => units < tier.minUnits) ?? null;
}

/** Units still needed to reach the next rung, or null at the top. */
export function unitsToNextTier(units: number): number | null {
  const next = nextTier(units);
  return next ? next.minUnits - units : null;
}

/** True once the order is large enough that we quote it by hand instead. */
export function needsQuote(units: number): boolean {
  return units >= bulkQuoteThreshold;
}

/** True when the earned tier ships free regardless of order total. */
export function earnsFreeShipping(units: number): boolean {
  return units >= bulkFreeShippingMinUnits;
}

/**
 * The bulk discount in minor units for a given discountable subtotal.
 *
 * `discountableMinor` must already exclude lines WooCommerce excludes from
 * coupons (gift cards) — the caller owns that filter, exactly as the cart's
 * PT25 math does.
 */
export function bulkDiscountMinor(
  discountableMinor: number,
  units: number
): number {
  const tier = tierForUnits(units);
  if (!tier) return 0;
  return Math.floor((discountableMinor * tier.percentOff) / 100);
}

/** The whole ladder, ascending — for rendering the tier table. */
export function bulkLadder(): BulkTier[] {
  return LADDER;
}
