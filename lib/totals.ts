/**
 * lib/totals.ts — cart pricing. ISOMORPHIC and side-effect free.
 *
 * Extracted from lib/cart.tsx so the server can price an order with exactly
 * the arithmetic the browser showed. Two implementations of money rules is one
 * too many: the checkout quotes a number, the server charges a number, and
 * they have to be the same number or customers get charged something they
 * never agreed to.
 *
 * Do not import React here, and do not add a "use client" directive — a server
 * route imports this module.
 *
 * The rules, in order:
 *   1. Coupon PT25 — a percentage off the DISCOUNTABLE subtotal. Lines flagged
 *      `excludedFromCoupons` (gift cards) are outside that base: a card keeps
 *      its full face value, so discounting one sells store credit below par.
 *      The same exclusion must be set on the PT25 coupon in WooCommerce.
 *   2. Bulk tiers — an automatic percentage earned by the discountable unit
 *      count (content/bulk.ts), on the same base.
 *   3. PROMO CODES DO NOT APPLY TO BULK ORDERS (owner rule, 2026-09-22). Once
 *      a tier is earned, bulk pricing is the pricing; a code already in the
 *      cart goes dormant and is reported on `blockedCoupons`.
 *   4. Free shipping over $200 post-discount on the full merchandise total,
 *      gift cards included, OR from the bulk ladder's free-shipping rung
 *      regardless of total. Below both, shipping is null (set at checkout).
 */

import { brandConfig } from "@/content/brand-config";
import { bulkDiscountMinor, earnsFreeShipping, tierForUnits } from "@/lib/bulk";

/** The subset of a cart line that pricing depends on. */
export interface PricedLine {
  price: number;
  qty: number;
  excludedFromCoupons?: boolean | undefined;
}

/** Adapter-canonical cart totals, in minor units. */
export interface Totals {
  itemsSubtotal: number;
  discount: number;
  /** null = not yet determinable (calculated at checkout); 0 = free. */
  shipping: number | null;
  total: number;
  currencyMinorUnit: number;
  appliedCoupons: string[];
  blockedCoupons: string[];
  bulkUnits: number;
  bulkTier: { code: string; percentOff: number } | null;
}

export const EMPTY_TOTALS: Totals = {
  itemsSubtotal: 0,
  discount: 0,
  shipping: null,
  total: 0,
  currencyMinorUnit: 2,
  appliedCoupons: [],
  blockedCoupons: [],
  bulkUnits: 0,
  bulkTier: null,
};

/** True when `code` is the store's standing promo code. */
export function isKnownCoupon(code: string): boolean {
  return code.trim().toUpperCase() === brandConfig.promos.coupon.code;
}

export function computeTotals(
  items: PricedLine[],
  appliedCoupons: string[]
): Totals {
  const itemsSubtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const discountable = items.reduce(
    (sum, i) => (i.excludedFromCoupons ? sum : sum + i.price * i.qty),
    0
  );
  // Units the bulk ladder counts — same lines that fund the discount.
  const bulkUnits = items.reduce(
    (sum, i) => (i.excludedFromCoupons ? sum : sum + i.qty),
    0
  );

  // Bulk pricing, once earned, replaces promo codes outright.
  const earnedTier = tierForUnits(bulkUnits);

  const couponPct = appliedCoupons.includes(brandConfig.promos.coupon.code)
    ? brandConfig.promos.coupon.percentOff
    : 0;
  const couponDiscount = Math.floor((discountable * couponPct) / 100);

  const discount = earnedTier
    ? bulkDiscountMinor(discountable, bulkUnits)
    : couponDiscount;

  // Codes that are in the cart but earning nothing because bulk is in force.
  const blockedCoupons = earnedTier ? appliedCoupons : [];

  const merchandise = itemsSubtotal - discount;

  const shipping: number | null =
    items.length > 0 &&
    (merchandise >= brandConfig.promos.freeShipping.thresholdMinor ||
      earnsFreeShipping(bulkUnits))
      ? 0
      : null;

  return {
    itemsSubtotal,
    discount,
    shipping,
    total: merchandise + (shipping ?? 0),
    currencyMinorUnit: 2,
    appliedCoupons,
    blockedCoupons,
    bulkUnits,
    bulkTier: earnedTier
      ? { code: earnedTier.code, percentOff: earnedTier.percentOff }
      : null,
  };
}
