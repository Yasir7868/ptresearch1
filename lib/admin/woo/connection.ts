/**
 * lib/admin/woo/connection.ts — SERVER-ONLY. A step-by-step check of the
 * WooCommerce connection for the Settings page, so a misconfiguration points
 * at the exact thing to fix instead of a generic error.
 *
 * Every check is a read. Write permission can't be confirmed without changing
 * something, so the page states that the key must be Read/Write.
 */

import "server-only";
import { wpOrigin } from "../config";
import { woo, wooRequest, WooError } from "./client";

export interface ConnectionCheck {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
}

export interface ConnectionReport {
  checkedAt: number;
  ok: boolean;
  checks: ConnectionCheck[];
}

async function check(
  id: string,
  label: string,
  run: () => Promise<string>
): Promise<ConnectionCheck> {
  try {
    return { id, label, ok: true, detail: await run() };
  } catch (err) {
    const detail = err instanceof WooError ? err.message : "Unexpected error.";
    return { id, label, ok: false, detail };
  }
}

export async function testConnection(): Promise<ConnectionReport> {
  const reachable = await check("reachable", "WordPress site is reachable", async () => {
    const index = await woo<{ name?: string }>("", {
      namespace: null,
      anonymous: true,
      query: { _fields: "name" },
      timeoutMs: 15_000,
    });
    return `Connected to “${index.name ?? wpOrigin()}” at ${wpOrigin()}.`;
  });
  if (!reachable.ok) {
    return { checkedAt: Date.now(), ok: false, checks: [reachable] };
  }

  const checks = await Promise.all([
    check("orders", "API keys can read orders", async () => {
      const res = await wooRequest<unknown[]>("/orders", { query: { per_page: 1, _fields: "id" } });
      return `${res.total ?? res.data.length} orders visible.`;
    }),
    check("counts", "Order status counts (same report as the WooCommerce app)", async () => {
      const totals = await woo<{ total: number }[]>("/reports/orders/totals");
      return `${totals.length} statuses reported.`;
    }),
    check("analytics", "WooCommerce Analytics (dashboard sales figures)", async () => {
      await woo("/reports/revenue/stats", {
        namespace: "wc-analytics",
        query: { interval: "day", per_page: 1 },
      });
      return "Sales figures available.";
    }),
    check("webhooks", "Webhook management (Administrator or Shop manager key)", async () => {
      const hooks = await woo<unknown[]>("/webhooks", { query: { per_page: 100, _fields: "id" } });
      return `${hooks.length} webhooks configured in WooCommerce.`;
    }),
  ]);

  const all = [reachable, ...checks];
  return { checkedAt: Date.now(), ok: all.every((c) => c.ok), checks: all };
}
