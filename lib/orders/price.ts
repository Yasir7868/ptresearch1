/**
 * lib/orders/price.ts — SERVER-ONLY. Re-prices a submitted cart from source.
 *
 * THE POINT OF THIS MODULE. The browser tells us what it wants to buy; it does
 * not get to tell us what that costs. Every line is re-looked-up in the live
 * catalog and re-priced here, and the totals are recomputed with the shared
 * arithmetic (lib/totals.ts) rather than trusted from the request. A customer
 * editing the JSON on its way out changes what they receive, never what they
 * pay.
 *
 * The client sends only references: product id, variation id, quantity — plus,
 * for a gift card, the face value it chose, which is re-validated against the
 * published rules rather than accepted.
 *
 * Anything that cannot be priced is rejected, not silently dropped: an order
 * missing a line the customer expected is its own kind of wrong.
 */

import "server-only";
import { getCatalog } from "@/lib/woo/catalog";
import type { Product } from "@/lib/woo/types";
import {
  GIFT_CARD_TIERS,
  giftCard,
  validateManualAmount,
  type GiftCardTier,
} from "@/content/gift-card";
import { computeTotals, isKnownCoupon, type Totals } from "@/lib/totals";

/** One line as the browser submits it — references and quantity only. */
export interface SubmittedLine {
  productId: number;
  variationId?: number | undefined;
  qty: number;
  /** Gift cards only: the chosen face value in minor units. */
  amountMinor?: number | undefined;
  /** Per-line data (gift-card recipient, message, delivery date). */
  meta?: { label: string; value: string }[] | undefined;
}

/** A line after the server has priced it. Authoritative. */
export interface PricedOrderLine {
  lineKey: string;
  sku: string;
  name: string;
  dose: string;
  productId: number;
  variationId?: number | undefined;
  unitPriceMinor: number;
  qty: number;
  lineTotalMinor: number;
  meta?: { label: string; value: string }[] | undefined;
  excludedFromCoupons: boolean;
}

export interface PricedCart {
  lines: PricedOrderLine[];
  totals: Totals;
}

export class PricingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PricingError";
  }
}

/** Hard cap per line — a guard against a runaway or hostile quantity. */
const MAX_LINE_QTY = 999;

function findGiftCardTier(variationId?: number): GiftCardTier | undefined {
  if (variationId === undefined) return GIFT_CARD_TIERS[0];
  return GIFT_CARD_TIERS.find((t) => t.variationId === variationId);
}

/** Price a gift card from its published rules, never from the request. */
function priceGiftCard(line: SubmittedLine): PricedOrderLine {
  const tier = findGiftCardTier(line.variationId);
  if (!tier) throw new PricingError("That gift card amount is not available.");

  const amount = line.amountMinor;
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    throw new PricingError("The gift card amount is missing.");
  }

  // Re-run the same validation the buy form ran, against the same rule.
  if (tier.manualAmount) {
    const invalid = validateManualAmount(String(amount / 100), tier.manualAmount);
    if (invalid) throw new PricingError("That gift card amount is not allowed.");
  } else if (amount !== tier.amountMinor) {
    throw new PricingError("That gift card amount is not allowed.");
  }

  return {
    lineKey: `${giftCard.sku}__${amount}`,
    sku: giftCard.sku,
    name: giftCard.name,
    dose: tier.value,
    productId: giftCard.productId,
    variationId: tier.variationId,
    unitPriceMinor: amount,
    // Gift cards are sold individually (WooCommerce `sold_individually`).
    qty: 1,
    lineTotalMinor: amount,
    ...(line.meta ? { meta: line.meta } : {}),
    excludedFromCoupons: giftCard.excludedFromCoupons,
  };
}

/** Price one catalog line from the live catalog record. */
function priceCatalogLine(line: SubmittedLine, product: Product): PricedOrderLine {
  if (!product.isInStock || !product.isPurchasable) {
    throw new PricingError(`${product.displayName} is no longer available.`);
  }

  let unitPriceMinor = product.priceMinor;
  let dose = product.size ?? "";
  let variationId: number | undefined;

  if (product.kind === "variable") {
    const variations = product.variations ?? [];
    const variation = variations.find((v) => v.variationId === line.variationId);
    if (!variation) {
      throw new PricingError(`Select a size for ${product.displayName}.`);
    }
    unitPriceMinor = variation.priceMinor;
    dose = variation.size;
    variationId = variation.variationId;
  }

  const qty = Math.trunc(line.qty);
  if (!Number.isFinite(qty) || qty < 1 || qty > MAX_LINE_QTY) {
    throw new PricingError(`Invalid quantity for ${product.displayName}.`);
  }

  return {
    lineKey: `${product.sku}__${dose}`,
    sku: product.sku,
    // GLP rule (PRODUCT.md #1): the mapper's coded display name, never raw.
    name: product.displayName,
    dose,
    productId: product.productId,
    ...(variationId !== undefined ? { variationId } : {}),
    unitPriceMinor,
    qty,
    lineTotalMinor: unitPriceMinor * qty,
    excludedFromCoupons: false,
  };
}

/**
 * Re-price a submitted cart against the live catalog and recompute totals.
 *
 * @throws PricingError with a message safe to show the customer.
 */
export async function priceSubmittedCart(
  lines: SubmittedLine[],
  submittedCoupons: string[] = []
): Promise<PricedCart> {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new PricingError("Your cart is empty.");
  }

  const catalog = await getCatalog();
  const byId = new Map(catalog.map((p) => [p.productId, p]));

  const priced: PricedOrderLine[] = [];
  for (const line of lines) {
    if (line.productId === giftCard.productId) {
      priced.push(priceGiftCard(line));
      continue;
    }
    const product = byId.get(line.productId);
    if (!product) {
      throw new PricingError("An item in your cart is no longer available.");
    }
    priced.push(priceCatalogLine(line, product));
  }

  // Only codes this store actually honours survive; the totals module then
  // decides whether they apply at all (bulk orders refuse promo codes).
  const coupons = submittedCoupons
    .map((c) => c.trim().toUpperCase())
    .filter((c, i, all) => isKnownCoupon(c) && all.indexOf(c) === i);

  const totals = computeTotals(
    priced.map((l) => ({
      // productId is load-bearing: bulk tiers are earned per product across
      // its strengths (lib/bulk.ts). Dropping it here would silently price
      // every order at full price no matter how many units were bought.
      productId: l.productId,
      price: l.unitPriceMinor,
      qty: l.qty,
      excludedFromCoupons: l.excludedFromCoupons,
    })),
    coupons
  );

  return { lines: priced, totals };
}
