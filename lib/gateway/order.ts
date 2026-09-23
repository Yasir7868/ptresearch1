/**
 * lib/gateway/order.ts — turns this site's cart into the gateway's order shape.
 *
 * Isomorphic: the browser builds the payload, the server route forwards it.
 *
 * MONEY UNITS. This repo counts in integer minor units (cents). The gateway's
 * order shape mirrors WooCommerce's, whose totals are decimal strings
 * ("44.00"), so every amount is converted on the way out. The Checkout Session
 * comes back with `amount` in Stripe's minor units, which gives us a check
 * worth having: `assertSessionAmount` refuses to mount a payment surface whose
 * amount disagrees with the cart. A unit misread would otherwise charge 100x,
 * and it would charge it silently.
 *
 * GLP rule (PRODUCT.md #1): line names are `CartItem.name`, which is already
 * the catalog mapper's coded display name. Nothing here re-derives a name.
 */

import type { CartItem, CartTotals } from "@/lib/cart";
import type {
  GatewayBusinessContext,
  GatewayLineItem,
  GatewayOrder,
} from "./types";
import { brandConfig } from "@/content/brand-config";

/**
 * The compliance block the processor expects from this merchant. These are the
 * gateway's own enum values (SDK README), not free text — a research-chemical
 * merchant that omits them looks like an unclassified high-risk seller.
 */
export const RUO_COMPLIANCE: GatewayBusinessContext = {
  buyer_type: "business_or_lab",
  use_case: "in_vitro_research",
  product_category: "ruo_reference_materials",
  site_acknowledgment: "research_use_only",
  not_for_consumption_acknowledged: true,
  coa_available: true,
  shipping_contains: "research_materials",
};

/** 4400 -> "44.00". The gateway's amounts are decimal strings. */
export function toMajorString(minor: number, minorUnit = 2): string {
  const sign = minor < 0 ? "-" : "";
  const digits = Math.abs(Math.round(minor)).toString().padStart(minorUnit + 1, "0");
  if (minorUnit === 0) return `${sign}${digits}`;
  const whole = digits.slice(0, -minorUnit);
  const fraction = digits.slice(-minorUnit);
  return `${sign}${whole}.${fraction}`;
}

/** The buyer details the checkout form collected. */
export interface GatewayBuyer {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

export interface BuildOrderInput {
  checkoutId: string;
  orderNumber: string;
  items: CartItem[];
  totals: CartTotals;
  buyer: GatewayBuyer;
  siteUrl: string;
}

function lineItem(item: CartItem, minorUnit: number): GatewayLineItem {
  const line: GatewayLineItem = {
    // The dose is part of what was bought; a receipt that omits it is wrong.
    name: item.dose ? `${item.name} — ${item.dose}` : item.name,
    quantity: item.qty,
    subtotal: toMajorString(item.price * item.qty, minorUnit),
    total: toMajorString(item.price * item.qty, minorUnit),
  };
  const productId = item.variationId ?? item.productId;
  if (productId !== undefined) line.product_id = String(productId);
  return line;
}

/**
 * Build the gateway order. `id` and `key` are both the stable checkout id:
 * this site has no server-side order record yet, and the gateway uses the pair
 * for idempotency and for reconciliation on the success page.
 */
export function buildGatewayOrder(input: BuildOrderInput): GatewayOrder {
  const { items, totals, buyer } = input;
  const mu = totals.currencyMinorUnit;

  return {
    id: input.checkoutId,
    key: input.checkoutId,
    number: input.orderNumber,
    currency: "USD",
    subtotal: toMajorString(totals.itemsSubtotal, mu),
    discount: toMajorString(totals.discount, mu),
    shipping: toMajorString(totals.shipping ?? 0, mu),
    tax: toMajorString(0, mu),
    total: toMajorString(totals.total, mu),
    items: items.map((item) => lineItem(item, mu)),
    customer: {
      email: buyer.email,
      first_name: buyer.firstName,
      last_name: buyer.lastName,
      ...(buyer.phone ? { phone: buyer.phone } : {}),
      ...(buyer.company ? { company: buyer.company } : {}),
    },
    billing: address(buyer),
    shipping_to: {
      first_name: buyer.firstName,
      last_name: buyer.lastName,
      ...address(buyer),
    },
    site: { url: input.siteUrl, name: brandConfig.name },
    ...(buyer.company ? { company_name: buyer.company, buyer_company: buyer.company } : {}),
    compliance: RUO_COMPLIANCE,
  };
}

function address(buyer: GatewayBuyer) {
  return {
    address_1: buyer.address1,
    ...(buyer.address2 ? { address_2: buyer.address2 } : {}),
    city: buyer.city,
    state: buyer.state,
    postcode: buyer.zip,
    country: buyer.country ?? "US",
  };
}

/**
 * Guard against a units mismatch between this site and the gateway.
 *
 * `session.amount` is Stripe's minor-unit figure. It must equal the cart total
 * we already computed. Anything else means the two sides disagree about money,
 * and the only safe response is to refuse the payment surface.
 */
export function assertSessionAmount(
  sessionAmount: number,
  expectedMinor: number
): void {
  if (sessionAmount !== expectedMinor) {
    throw new Error(
      `Payment amount mismatch: the gateway quoted ${sessionAmount} but this order is ${expectedMinor} (minor units). Payment was not started.`
    );
  }
}

// ---------------------------------------------------------------------------
// Stable checkout identity
// ---------------------------------------------------------------------------

/**
 * A fingerprint of everything that decides what is being charged. When it
 * changes the checkout is a genuinely new one and needs a fresh id, or the
 * gateway's idempotency would hand back a session priced for the old cart.
 */
export function cartFingerprint(items: CartItem[], totals: CartTotals): string {
  const lines = items
    .map((i) => `${i.key}:${i.qty}:${i.price}`)
    .sort()
    .join("|");
  return `${lines}#${totals.total}:${totals.discount}:${totals.shipping ?? "null"}`;
}
