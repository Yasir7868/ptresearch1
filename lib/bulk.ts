/**
 * lib/bulk.ts — bulk-tier math. Pure, isomorphic, no React, no I/O.
 *
 * PER PRODUCT, NOT PER ORDER. A tier is earned by the unit count of one
 * product, summed across its strengths (content/bulk.ts explains why). Each
 * product earns its own tier independently, so one 50-unit compound can be at
 * the top rung while a 10-unit compound on the same order sits on the first.
 *
 * One implementation feeds every surface, so the ladder can never disagree
 * with itself: the /bulk builder, the cart totals (lib/totals.ts), the
 * server's order pricing (lib/orders/price.ts), and anything that needs to
 * name the coupon WooCommerce should be holding.
 *
 * Money is integer minor units (cents) throughout. Rounding is `Math.floor`
 * per product group, matching WooCommerce's percent-coupon behaviour of
 * discounting down to the cent.
 */

import {
  bulkMinUnits,
  bulkQuoteThreshold,
  bulkTiers,
  type BulkTier,
} from "@/content/bulk";

/** Ascending copy of the ladder — content order is not trusted. */
const LADDER: BulkTier[] = [...bulkTiers].sort(
  (a, b) => a.minUnits - b.minUnits
);

/** The highest tier this many units of ONE product earns, or null. */
export function tierForUnits(units: number): BulkTier | null {
  let earned: BulkTier | null = null;
  for (const tier of LADDER) {
    if (units >= tier.minUnits) earned = tier;
    else break;
  }
  return earned;
}

/** The next rung up for one product, or null once the top tier is earned. */
export function nextTier(units: number): BulkTier | null {
  return LADDER.find((tier) => units < tier.minUnits) ?? null;
}

/** Units still needed to reach the next rung, or null at the top. */
export function unitsToNextTier(units: number): number | null {
  const next = nextTier(units);
  return next ? next.minUnits - units : null;
}

/** True once the order is large enough that we quote it by hand instead. */
export function needsQuote(totalUnits: number): boolean {
  return totalUnits >= bulkQuoteThreshold;
}

/** The whole ladder, ascending — for rendering the tier table. */
export function bulkLadder(): BulkTier[] {
  return LADDER;
}

// ---------------------------------------------------------------------------
// Per-product grouping
// ---------------------------------------------------------------------------

/** The subset of a cart line bulk pricing depends on. */
export interface BulkLine {
  /**
   * The parent product id. Lines that share it are the same compound at
   * different strengths and their units add up. A line without one cannot be
   * grouped, so it never earns bulk pricing.
   */
  productId?: number | undefined;
  price: number;
  qty: number;
  /** Gift cards: outside every discount, and outside the unit count. */
  excludedFromCoupons?: boolean | undefined;
}

/** What one product contributed to the order. */
export interface BulkGroup {
  productId: number;
  units: number;
  subtotalMinor: number;
  tier: BulkTier | null;
  discountMinor: number;
}

/** Group discountable lines by product and price each group's tier. */
export function bulkGroups(lines: BulkLine[]): BulkGroup[] {
  const byProduct = new Map<number, { units: number; subtotalMinor: number }>();

  for (const line of lines) {
    if (line.excludedFromCoupons) continue;
    if (line.productId === undefined) continue;
    const group = byProduct.get(line.productId) ?? {
      units: 0,
      subtotalMinor: 0,
    };
    group.units += line.qty;
    group.subtotalMinor += line.price * line.qty;
    byProduct.set(line.productId, group);
  }

  return [...byProduct].map(([productId, group]) => {
    const tier = tierForUnits(group.units);
    return {
      productId,
      units: group.units,
      subtotalMinor: group.subtotalMinor,
      tier,
      // Floor per group, as WooCommerce would per coupon application.
      discountMinor: tier
        ? Math.floor((group.subtotalMinor * tier.percentOff) / 100)
        : 0,
    };
  });
}

/** The order's total bulk discount, in minor units. */
export function bulkDiscountMinor(lines: BulkLine[]): number {
  return bulkGroups(lines).reduce((sum, g) => sum + g.discountMinor, 0);
}

/** Units sitting in products that actually reached the minimum. */
export function qualifyingUnits(lines: BulkLine[]): number {
  return bulkGroups(lines).reduce(
    (sum, g) => (g.tier ? sum + g.units : sum),
    0
  );
}

/** The deepest tier any single product in the order earned, or null. */
export function bestTier(lines: BulkLine[]): BulkTier | null {
  let best: BulkTier | null = null;
  for (const group of bulkGroups(lines)) {
    if (group.tier && (!best || group.tier.percentOff > best.percentOff)) {
      best = group.tier;
    }
  }
  return best;
}

/** True when at least one product in the order is at bulk pricing. */
export function isBulkOrder(lines: BulkLine[]): boolean {
  return bulkGroups(lines).some((g) => g.tier !== null);
}

/**
 * A bulk order ships free — it has cleared a volume threshold far above the
 * spend one. Below that, the normal $200 rule in lib/totals.ts still applies.
 */
export function earnsFreeShipping(lines: BulkLine[]): boolean {
  return isBulkOrder(lines);
}

/** Re-exported so callers need only this module. */
export { bulkMinUnits };
