/**
 * POST /api/webhooks/woocommerce — WooCommerce tells the app about changes.
 *
 * Verifies X-WC-Webhook-Signature (HMAC-SHA256 of the raw body with
 * WOO_WEBHOOK_SECRET), then:
 *   - order.*   → drops the admin panel's cached counts/figures, so open tabs
 *                 see the change on their next poll (≤ 30s)
 *   - product.* → drops the product index and marks the storefront catalog
 *                 stale, so the shop reflects price/stock edits made in WP
 *                 admin or the WooCommerce app
 *
 * Must answer quickly with 2xx: WooCommerce disables a webhook after 5 failed
 * deliveries in a row. The unsigned "webhook_id=N" ping sent when a webhook is
 * saved gets a plain 200.
 */

import { NextResponse, type NextRequest } from "next/server";
import { webhookSecret } from "@/lib/admin/config";
import { invalidate } from "@/lib/admin/memo";
import { refreshStorefrontProduct } from "@/lib/admin/woo/products";
import { isDeliveryPing, recordDelivery, recordPing, recordRejection, verifySignature } from "@/lib/admin/woo/webhooks";

const MAX_BODY_BYTES = 2 * 1024 * 1024;

/**
 * The raw body, or null once it passes the limit. Counted while streaming:
 * Content-Length can be missing (chunked) or wrong, and this endpoint is
 * public until the signature is checked.
 */
async function readBody(request: NextRequest, limit: number): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function safely(record: () => void) {
  try {
    record();
  } catch (err) {
    // The admin database may not be configured; webhooks still work without it.
    console.error("[webhook] couldn't record delivery", err);
  }
}

export async function POST(request: NextRequest) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  }

  const raw = await readBody(request, MAX_BODY_BYTES);
  if (raw === null) {
    return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  }
  const signature = request.headers.get("x-wc-webhook-signature");

  if (!signature) {
    if (isDeliveryPing(raw)) {
      safely(recordPing);
      return NextResponse.json({ ok: true });
    }
    safely(() => recordRejection("A request arrived without a WooCommerce signature."));
    return NextResponse.json({ error: "Missing signature." }, { status: 401 });
  }

  const secret = webhookSecret();
  if (!secret) {
    safely(() => recordRejection("WOO_WEBHOOK_SECRET is not set on the server."));
    return NextResponse.json({ error: "Webhooks aren't configured." }, { status: 503 });
  }
  if (!verifySignature(raw, signature, secret)) {
    safely(() => recordRejection("Signature mismatch: the webhook's secret in WooCommerce doesn't match WOO_WEBHOOK_SECRET."));
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const topic = request.headers.get("x-wc-webhook-topic") ?? "unknown";
  const resource = request.headers.get("x-wc-webhook-resource") ?? topic.split(".")[0];
  let payload: { id?: number; slug?: string; parent_id?: number } = {};
  try {
    payload = JSON.parse(raw);
  } catch {
    // Signed but not JSON (action.* hooks can send other shapes); still a valid delivery.
  }
  const resourceId = typeof payload.id === "number" ? payload.id : null;

  if (resource === "order") {
    invalidate("orders");
    // A new or cancelled order can change stock on the storefront.
    if (topic === "order.created" || topic === "order.updated") refreshStorefrontProduct(null, null);
  } else if (resource === "product") {
    invalidate("products", "orders");
    refreshStorefrontProduct(payload.parent_id || resourceId, typeof payload.slug === "string" ? payload.slug : null);
  }

  safely(() => recordDelivery(topic, resourceId));
  return NextResponse.json({ ok: true });
}
