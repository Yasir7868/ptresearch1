/**
 * lib/admin/actions.ts — SERVER-ONLY helpers shared by the admin Server
 * Actions: turn any thrown error into an ActionState the form can show, and
 * build absolute links (invites, resets, webhooks) from the incoming request.
 */

import "server-only";
import { headers } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { fail, type ActionState } from "./action-state";
import { ActionDenied } from "./auth";
import { AdminConfigError } from "./config";
import { UserRuleError } from "./users";
import { WooError } from "./woo/client";

export function actionError(err: unknown): ActionState {
  // redirect()/notFound() must keep propagating.
  unstable_rethrow(err);
  if (
    err instanceof ActionDenied ||
    err instanceof UserRuleError ||
    err instanceof WooError ||
    err instanceof AdminConfigError
  ) {
    return fail(err.message);
  }
  console.error("[admin] action failed", err);
  return fail("Something went wrong. Try again, and if it keeps happening check the server logs.");
}

/**
 * Origin of the current request, e.g. "https://ptresearch.shop" — used for
 * invite/reset links and the webhook delivery URL.
 *
 * Server Actions carry the browser's Origin header, which Next.js has already
 * checked against the host before the action runs, so it is preferred over
 * forwarded headers. Page renders (no Origin) fall back to the host headers.
 */
export async function requestOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin && origin !== "null") {
    try {
      const url = new URL(origin);
      if (url.protocol === "https:" || url.protocol === "http:") return url.origin;
    } catch {
      // fall through to the host headers
    }
  }
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  if (host) return `${proto.split(",")[0]!.trim()}://${host.split(",")[0]!.trim()}`;
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

export function formString(data: FormData, key: string): string {
  const value = data.get(key);
  return typeof value === "string" ? value : "";
}

export function formInt(data: FormData, key: string): number | null {
  const n = Number(formString(data, key));
  return Number.isInteger(n) && n > 0 ? n : null;
}
