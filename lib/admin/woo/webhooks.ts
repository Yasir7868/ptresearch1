/**
 * lib/admin/woo/webhooks.ts — SERVER-ONLY. WooCommerce webhooks: how the
 * panel hears about changes made anywhere else (checkout, WP admin, the
 * WooCommerce mobile app) the moment they happen.
 *
 * WooCommerce signs each delivery: base64(HMAC-SHA256(raw body, secret)) in
 * X-WC-Webhook-Signature. When a webhook is saved it first sends an unsigned
 * form-encoded "webhook_id=<n>" ping that must be answered with HTTP 200, and
 * it does not follow redirects — the delivery URL must be the final https URL.
 * After 5 failed deliveries in a row WooCommerce disables the webhook, so the
 * Settings page shows each webhook's status and can switch it back on.
 */

import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { readKv, writeKv } from "../db";
import { woo } from "./client";
import type { WooWebhook } from "./types";

export const WEBHOOK_TOPICS = [
  "order.created",
  "order.updated",
  "order.deleted",
  "order.restored",
  "product.created",
  "product.updated",
  "product.deleted",
] as const;

export const WEBHOOK_PATH = "/api/webhooks/woocommerce";

export function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest();
  let given: Buffer;
  try {
    given = Buffer.from(signature.trim(), "base64");
  } catch {
    return false;
  }
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** WooCommerce's delivery ping when a webhook is created or re-activated. */
export function isDeliveryPing(rawBody: string): boolean {
  return /^webhook_id=\d+$/.test(rawBody.trim());
}

// ---------------------------------------------------------------------------
// Delivery health (for Settings)
// ---------------------------------------------------------------------------

export interface WebhookHealth {
  lastReceived: { at: number; topic: string; resourceId: number | null } | null;
  lastRejected: { at: number; reason: string } | null;
  lastPing: { at: number } | null;
}

export function recordDelivery(topic: string, resourceId: number | null): void {
  writeKv("webhook:last-received", { at: Date.now(), topic, resourceId });
}

export function recordRejection(reason: string): void {
  writeKv("webhook:last-rejected", { at: Date.now(), reason });
}

export function recordPing(): void {
  writeKv("webhook:last-ping", { at: Date.now() });
}

export function getWebhookHealth(): WebhookHealth {
  return {
    lastReceived: readKv<WebhookHealth["lastReceived"]>("webhook:last-received")?.value ?? null,
    lastRejected: readKv<WebhookHealth["lastRejected"]>("webhook:last-rejected")?.value ?? null,
    lastPing: readKv<WebhookHealth["lastPing"]>("webhook:last-ping")?.value ?? null,
  };
}

// ---------------------------------------------------------------------------
// Managing webhooks in WooCommerce
// ---------------------------------------------------------------------------

export async function listWebhooks(): Promise<WooWebhook[]> {
  return woo<WooWebhook[]>("/webhooks", {
    query: {
      per_page: 100,
      status: "all",
      _fields: "id,name,status,topic,delivery_url,date_created_gmt",
    },
  });
}

function sameUrl(a: string, b: string): boolean {
  return a.replace(/\/+$/, "").toLowerCase() === b.replace(/\/+$/, "").toLowerCase();
}

/**
 * Make sure one active webhook per topic points at this app. Creates the
 * missing ones and re-activates paused/disabled ones. Existing webhooks keep
 * their secret — if they were created with a different secret, delete them in
 * WooCommerce and run this again.
 */
export async function ensureWebhooks(
  deliveryUrl: string,
  secret: string
): Promise<{ created: string[]; reactivated: string[]; alreadyActive: string[] }> {
  const existing = (await listWebhooks()).filter((w) => sameUrl(w.delivery_url, deliveryUrl));
  const created: string[] = [];
  const reactivated: string[] = [];
  const alreadyActive: string[] = [];

  for (const topic of WEBHOOK_TOPICS) {
    const match = existing.find((w) => w.topic === topic);
    if (!match) {
      await woo("/webhooks", {
        method: "POST",
        body: {
          name: `Primetime admin panel: ${topic}`,
          topic,
          delivery_url: deliveryUrl,
          secret,
          status: "active",
        },
        query: { _fields: "id" },
      });
      created.push(topic);
    } else if (match.status !== "active") {
      await woo(`/webhooks/${match.id}`, {
        method: "PUT",
        body: { status: "active" },
        query: { _fields: "id" },
      });
      reactivated.push(topic);
    } else {
      alreadyActive.push(topic);
    }
  }
  return { created, reactivated, alreadyActive };
}

export async function setWebhookActive(webhookId: number): Promise<void> {
  await woo(`/webhooks/${webhookId}`, {
    method: "PUT",
    body: { status: "active" },
    query: { _fields: "id" },
  });
}
