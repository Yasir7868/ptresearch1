/**
 * POST /api/payment/embedded-session — price the cart, create the order,
 * open an embedded Checkout Session for it.
 *
 * THE ORDER IS BUILT HERE, NOT IN THE BROWSER. The request carries buyer
 * details and product references only. Every line is re-looked-up and
 * re-priced from the live catalog (lib/orders/price.ts), the totals are
 * recomputed with the same arithmetic the cart showed (lib/totals.ts), and the
 * order row is written BEFORE the gateway is asked for a session — so a
 * payment can never exist without an order to attach it to, and a customer
 * cannot choose their own price by editing the request.
 *
 * Idempotent on `checkout_id`: the same key returns the existing order's
 * session rather than creating a second order. That is what makes the
 * browser's retry-on-error safe.
 *
 * Response carries only what the browser needs to mount the payment surface,
 * plus `order_key` (the public handle for the confirmation page) and the
 * server's own totals, so the client can show what it will actually be
 * charged rather than what it guessed.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { gateway, gatewayCallbackUrl, gatewayConfigured, gatewaySiteUrl } from "@/lib/gateway/config";
import { GatewayApiError } from "@/lib/gateway/server";
import { buildGatewayOrder, RUO_COMPLIANCE } from "@/lib/gateway/order";
import { PricingError, priceSubmittedCart } from "@/lib/orders/price";
import {
  attachCheckoutSession,
  createOrder,
  getOrderByKey,
  updateOrderBuyer,
} from "@/lib/orders/store";
import { US_STATES } from "@/components/checkout/us-states";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_CODES = US_STATES.map((s) => s.code);

const LineSchema = z.object({
  productId: z.number().int().positive(),
  variationId: z.number().int().positive().optional(),
  qty: z.number().int().min(1).max(999),
  amountMinor: z.number().int().positive().optional(),
  meta: z
    .array(z.object({ label: z.string().max(80), value: z.string().max(500) }))
    .max(10)
    .optional(),
});

const BodySchema = z.object({
  checkout_id: z.string().trim().min(8).max(120),
  /** Set once an order exists for this checkout id — lets a retry resume it. */
  order_key: z.string().trim().max(120).optional(),
  buyer: z.object({
    email: z.string().trim().email().max(200),
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    phone: z.string().trim().max(40).optional(),
    company: z.string().trim().max(160).optional(),
    address1: z.string().trim().min(4).max(200),
    address2: z.string().trim().max(120).optional(),
    city: z.string().trim().min(2).max(100),
    state: z.string().trim().refine((s) => STATE_CODES.includes(s), "Unknown state."),
    postcode: z.string().trim().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP Code."),
    notes: z.string().trim().max(500).optional(),
  }),
  lines: z.array(LineSchema).min(1).max(100),
  coupons: z.array(z.string().trim().max(40)).max(5).optional(),
});

export async function POST(request: Request) {
  if (!gatewayConfigured()) {
    return NextResponse.json(
      { error: "Payment is not configured on this deployment." },
      { status: 503 }
    );
  }

  let parsed;
  try {
    parsed = BodySchema.safeParse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid checkout details." },
      { status: 400 }
    );
  }

  const body = parsed.data;
  const siteUrl = gatewaySiteUrl();

  try {
    // A retry for a checkout that already has an order resumes it rather than
    // creating a second order for the same basket.
    const existing = body.order_key ? getOrderByKey(body.order_key) : null;
    if (existing && existing.paymentStatus === "paid") {
      return NextResponse.json(
        { error: "This order has already been paid." },
        { status: 409 }
      );
    }

    // Price from source. Nothing the browser said about money is used.
    const { lines, totals } = await priceSubmittedCart(
      body.lines,
      body.coupons ?? []
    );

    let order = existing;
    if (order) {
      // Resuming: the customer may have unlocked and edited their details
      // since the order was created, so the row is brought up to date.
      updateOrderBuyer(order.id, body.buyer);
      order = getOrderByKey(order.orderKey) ?? order;
    } else {
      order = createOrder({ buyer: body.buyer, lines, totals });
    }

    const gatewayOrder = buildGatewayOrder({
      checkoutId: order.orderKey,
      orderNumber: order.orderNumber,
      items: lines.map((l) => ({
        key: l.lineKey,
        sku: l.sku,
        dose: l.dose,
        name: l.name,
        price: l.unitPriceMinor,
        qty: l.qty,
        productId: l.productId,
        variationId: l.variationId,
        excludedFromCoupons: l.excludedFromCoupons,
      })),
      totals,
      siteUrl,
      buyer: {
        email: body.buyer.email,
        firstName: body.buyer.firstName,
        lastName: body.buyer.lastName,
        ...(body.buyer.phone ? { phone: body.buyer.phone } : {}),
        ...(body.buyer.company ? { company: body.buyer.company } : {}),
        address1: body.buyer.address1,
        ...(body.buyer.address2 ? { address2: body.buyer.address2 } : {}),
        city: body.buyer.city,
        state: body.buyer.state,
        zip: body.buyer.postcode,
      },
    });

    const session = await gateway().createEmbeddedCheckoutSession({
      order: gatewayOrder,
      // The order key is the stable idempotency handle end to end.
      checkout_id: order.orderKey,
      idempotency_key: order.orderKey,
      success_url: `${siteUrl}/order-received?order=${order.orderKey}`,
      cancel_url: `${siteUrl}/checkout`,
      return_url: `${siteUrl}/order-received?order=${order.orderKey}&session_id={CHECKOUT_SESSION_ID}`,
      redirect_on_completion: "if_required",
      callback_url: gatewayCallbackUrl(),
      source: "custom_site",
      ...(body.buyer.company
        ? { company_name: body.buyer.company, buyer_company: body.buyer.company }
        : {}),
      compliance: RUO_COMPLIANCE,
    });

    attachCheckoutSession(order.id, session.checkout_session_id);

    return NextResponse.json({
      ...session,
      order_key: order.orderKey,
      order_number: order.orderNumber,
      // Server-canonical totals — what the customer will actually be charged.
      totals: {
        itemsSubtotal: totals.itemsSubtotal,
        discount: totals.discount,
        shipping: totals.shipping,
        total: totals.total,
        currencyMinorUnit: totals.currencyMinorUnit,
        appliedCoupons: totals.appliedCoupons,
        blockedCoupons: totals.blockedCoupons,
        bulkUnits: totals.bulkUnits,
        bulkTier: totals.bulkTier,
      },
    });
  } catch (error) {
    if (error instanceof PricingError) {
      // Safe to show: written for the customer.
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    const message =
      error instanceof GatewayApiError
        ? error.message
        : "Could not start payment. Please try again.";
    const status = error instanceof GatewayApiError ? error.status || 502 : 502;
    console.error("[payment] embedded session failed", error);
    return NextResponse.json({ error: message }, { status });
  }
}
