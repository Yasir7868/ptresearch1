/**
 * POST /api/payment/callback — signed payment events from the gateway.
 *
 * This is the source of truth for whether money moved. Everything here is
 * ordered around that:
 *
 *   1. Read the body as RAW TEXT. The signature covers the exact bytes sent;
 *      parsing first and re-serializing would change them and fail every
 *      verification.
 *   2. Verify hmac_sha256(rawBody, sha256(merchantToken)) against the
 *      `x-platform-signature` header BEFORE parsing, and reject with 401 on
 *      any mismatch. An unverified body is an attacker claiming an order was
 *      paid.
 *   3. Only then record it (lib/admin/payments.ts).
 *
 * Events: payment.succeeded, payment.failed, checkout.session.expired.
 *
 * Returns 200 on a body we cannot parse but whose signature is valid — it came
 * from the processor, and a non-2xx would make them retry a body that will
 * never parse. The failure is logged instead.
 */

import { NextResponse } from "next/server";
import { verifyGatewayCallbackSignature } from "@/lib/gateway/signature";
import { gatewayConfigured, gatewayMerchantToken } from "@/lib/gateway/config";
import { recordPaymentEvent } from "@/lib/admin/payments";
import { markOrderPaid, markOrderUnsuccessful } from "@/lib/orders/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Event names and statuses that mean money moved. */
const PAID_EVENTS = new Set(["payment.succeeded", "payment_succeeded"]);
const PAID_STATUSES = new Set(["paid", "succeeded", "complete", "completed"]);

/** …and the ones that mean it did not. */
const FAILED_EVENTS = new Set([
  "payment.failed",
  "payment_failed",
  "checkout.session.expired",
  "checkout_session_expired",
]);
const FAILED_STATUSES = new Set(["failed", "expired", "canceled", "cancelled"]);

/** Shapes seen across the gateway's events; every field is treated as optional. */
interface CallbackBody {
  event?: string;
  type?: string;
  status?: string;
  payment_status?: string;
  checkout_session_id?: string;
  session_id?: string;
  checkout_id?: string;
  order_id?: string;
  order_key?: string;
  order_number?: string;
  amount?: number;
  currency?: string;
  customer_email?: string;
  email?: string;
}

export async function POST(request: Request) {
  if (!gatewayConfigured()) {
    return NextResponse.json({ error: "Payment is not configured." }, { status: 503 });
  }

  // 1 — raw bytes, before anything touches them.
  const rawBody = await request.text();
  const signature = request.headers.get("x-platform-signature");

  // 2 — verify before parse.
  const isValid = await verifyGatewayCallbackSignature({
    rawBody,
    signature,
    merchantToken: gatewayMerchantToken(),
  });

  if (!isValid) {
    console.warn("[payment] callback rejected: bad signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: CallbackBody;
  try {
    body = JSON.parse(rawBody) as CallbackBody;
  } catch {
    console.error("[payment] verified callback was not JSON");
    return NextResponse.json({ ok: true });
  }

  const sessionId = body.checkout_session_id || body.session_id;
  if (!sessionId) {
    console.error("[payment] verified callback had no session id", body.event ?? body.type);
    return NextResponse.json({ ok: true });
  }

  const event = (body.event || body.type || "unknown").toLowerCase();
  const status = (body.payment_status || body.status || "unknown").toLowerCase();

  // 3 — record the event, then move the order.
  try {
    recordPaymentEvent({
      sessionId,
      checkoutId: body.checkout_id || body.order_key || body.order_id,
      orderNumber: body.order_number,
      event,
      status,
      amountMinor: typeof body.amount === "number" ? body.amount : undefined,
      currency: body.currency,
      email: body.customer_email || body.email,
      raw: rawBody,
    });

    // 4 — the order itself. Both helpers are idempotent and refuse to
    // downgrade an order that is already paid.
    if (PAID_EVENTS.has(event) || PAID_STATUSES.has(status)) {
      const order = markOrderPaid({
        sessionId,
        amountMinor: typeof body.amount === "number" ? body.amount : undefined,
      });
      if (!order) {
        // Paid with no order attached is a real problem, not a nuisance:
        // money moved and nothing here knows what for.
        console.error("[payment] PAID callback for unknown session", sessionId);
      }
    } else if (FAILED_EVENTS.has(event) || FAILED_STATUSES.has(status)) {
      markOrderUnsuccessful({
        sessionId,
        paymentStatus: event.includes("expired") || status === "expired"
          ? "expired"
          : "failed",
      });
    }
  } catch (error) {
    // A write failure IS worth a retry — the processor should send it again.
    console.error("[payment] could not record callback", error);
    return NextResponse.json({ error: "Could not record event" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
