/**
 * POST /api/payment/reconcile — confirm a Checkout Session from the success page.
 *
 * Callbacks are the source of truth, but they are server-to-server and may not
 * have landed by the time the customer's browser reaches the confirmation
 * page. This asks the gateway directly so the page can state the payment
 * status instead of guessing from the fact that a redirect happened.
 *
 * It answers with the recorded callback when one already exists, and otherwise
 * calls the gateway. Only the payment status is returned — never the raw
 * callback body, which is staff-facing.
 */

import { NextResponse } from "next/server";
import { gateway, gatewayConfigured } from "@/lib/gateway/config";
import { GatewayApiError } from "@/lib/gateway/server";
import { findPaymentBySession } from "@/lib/admin/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!gatewayConfigured()) {
    return NextResponse.json({ error: "Payment is not configured." }, { status: 503 });
  }

  let body: { session_id?: string; order_id?: string; order_key?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const sessionId = body.session_id?.trim();
  if (!sessionId) {
    return NextResponse.json({ error: "session_id is required." }, { status: 400 });
  }

  // A verified callback already settled this one.
  const recorded = findPaymentBySession(sessionId);
  if (recorded) {
    return NextResponse.json({
      ok: true,
      source: "callback",
      payment_status: recorded.status,
      status: recorded.status,
      order_number: recorded.orderNumber ?? null,
    });
  }

  try {
    const result = await gateway().reconcileCheckoutSession({
      checkout_session_id: sessionId,
      ...(body.order_id ? { order_id: body.order_id } : {}),
      ...(body.order_key ? { order_key: body.order_key } : {}),
    });

    return NextResponse.json({
      ok: result.ok,
      source: "gateway",
      payment_status: result.payment_status,
      status: result.status,
      order_number: null,
    });
  } catch (error) {
    const status = error instanceof GatewayApiError ? error.status || 502 : 502;
    console.error("[payment] reconcile failed", error);
    return NextResponse.json(
      { error: "Could not confirm payment status." },
      { status }
    );
  }
}
