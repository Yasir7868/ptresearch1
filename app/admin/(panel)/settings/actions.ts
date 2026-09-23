"use server";

import { refresh } from "next/cache";
import { fail, ok, type ActionState } from "@/lib/admin/action-state";
import { actionError, requestOrigin } from "@/lib/admin/actions";
import { recordActivity } from "@/lib/admin/activity";
import { authorize } from "@/lib/admin/auth";
import { webhookSecret } from "@/lib/admin/config";
import { invalidate } from "@/lib/admin/memo";
import { testConnection, type ConnectionReport } from "@/lib/admin/woo/connection";
import { WEBHOOK_PATH, ensureWebhooks, setWebhookActive } from "@/lib/admin/woo/webhooks";

export async function runConnectionTest(): Promise<
  { ok: true; report: ConnectionReport } | { ok: false; message: string }
> {
  try {
    await authorize("settings.manage");
    invalidate("orders", "products", "statuses", "settings");
    return { ok: true, report: await testConnection() };
  } catch (err) {
    const state = actionError(err);
    return { ok: false, message: state.status === "error" ? state.message : "The test couldn't run." };
  }
}

export async function connectWebhooks(): Promise<ActionState> {
  try {
    const user = await authorize("settings.manage");
    const secret = webhookSecret();
    if (!secret) {
      return fail("Set WOO_WEBHOOK_SECRET on the server first (a long random string), then restart the app.");
    }
    const origin = await requestOrigin();
    if (!origin.startsWith("https://") || /\/\/(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(origin)) {
      return fail(
        `WooCommerce can only deliver webhooks to a public https address, and this page is open at ${origin}. Do this from the deployed admin panel.`
      );
    }

    const result = await ensureWebhooks(`${origin}${WEBHOOK_PATH}`, secret);
    await recordActivity({
      actor: user,
      action: "settings.webhooks_connected",
      target: { type: "store", id: "webhooks" },
      summary: `Connected WooCommerce webhooks (${result.created.length} created, ${result.reactivated.length} re-activated, ${result.alreadyActive.length} already active)`,
    });
    refresh();
    if (result.created.length === 0 && result.reactivated.length === 0) {
      return ok("All webhooks were already connected and active.");
    }
    return ok(
      `Done: ${result.created.length} webhook${result.created.length === 1 ? "" : "s"} created and ${result.reactivated.length} re-activated. WooCommerce now tells this panel about changes as they happen.`
    );
  } catch (err) {
    return actionError(err);
  }
}

export async function activateWebhook(webhookId: number): Promise<ActionState> {
  try {
    const user = await authorize("settings.manage");
    await setWebhookActive(Number(webhookId));
    await recordActivity({
      actor: user,
      action: "settings.webhook_activated",
      target: { type: "store", id: `webhook:${webhookId}` },
      summary: `Re-activated WooCommerce webhook #${webhookId}`,
    });
    refresh();
    return ok("Webhook re-activated.");
  } catch (err) {
    return actionError(err);
  }
}
