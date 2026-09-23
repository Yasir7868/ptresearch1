/**
 * lib/admin/woo/client.ts — SERVER-ONLY. Authenticated client for the
 * WooCommerce REST API (wc/v3) and WooCommerce Analytics (wc-analytics).
 *
 * This is how the admin panel stays "the same" as WP admin and the WooCommerce
 * mobile app: all three read and write the same WooCommerce database through
 * the same API. Nothing here caches — callers decide (lib/admin/memo.ts).
 *
 * Auth: HTTP Basic with the consumer key/secret over HTTPS (WooCommerce's
 * documented method). Some hosts strip the Authorization header; set
 * WOO_AUTH_MODE=query to send the keys as query parameters instead. In that
 * mode URLs carry secrets, so URLs are never included in errors or logs.
 *
 * Reliability: GETs retry transient failures (429/5xx/network/timeout) with
 * jittered backoff; writes never retry (a timed-out write may have landed).
 * Responses are parsed tolerantly — WordPress hosts sometimes print PHP
 * notices before the JSON body.
 */

import "server-only";
import { decodeEntities } from "@/lib/woo/mapper";
import { wooCredentials, wpOrigin } from "../config";

export type WooErrorKind =
  | "not_configured"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "invalid_request"
  | "rate_limited"
  | "unavailable"
  | "timeout"
  | "network"
  | "bad_response";

export class WooError extends Error {
  readonly kind: WooErrorKind;
  readonly status: number;
  readonly code: string | null;

  constructor(kind: WooErrorKind, message: string, status = 0, code: string | null = null) {
    super(message);
    this.name = "WooError";
    this.kind = kind;
    this.status = status;
    this.code = code;
  }
}

type QueryValue = string | number | boolean | null | undefined | readonly (string | number)[];

export interface WooRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  query?: Record<string, QueryValue>;
  body?: unknown;
  /** REST namespace. Default "wc/v3"; null for the WordPress REST index. */
  namespace?: "wc/v3" | "wc-analytics" | null;
  timeoutMs?: number;
  /** Don't send credentials (public endpoints). */
  anonymous?: boolean;
}

export interface WooResponse<T> {
  data: T;
  total: number | null;
  totalPages: number | null;
}

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 20_000;

export function isWooConfigured(): boolean {
  return wooCredentials() !== null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffMs(attempt: number, res?: Response): number {
  const retryAfter = Number(res?.headers.get("retry-after"));
  if (Number.isFinite(retryAfter) && retryAfter > 0) return Math.min(retryAfter * 1000, 8000);
  return Math.round(500 * 2 ** (attempt - 1) * (0.8 + Math.random() * 0.4));
}

function buildUrl(path: string, options: WooRequestOptions): URL {
  const namespace = options.namespace === undefined ? "wc/v3" : options.namespace;
  const base = `${wpOrigin()}/wp-json/${namespace ? `${namespace}` : ""}`;
  const url = new URL(`${base}${path}`);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value === null || value === undefined || value === "") continue;
    url.searchParams.set(key, Array.isArray(value) ? value.join(",") : String(value));
  }
  return url;
}

/** Parse a JSON body, tolerating junk printed before it. */
function parseBody(text: string): unknown {
  const trimmed = text.replace(/^﻿/, "").trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.search(/[[{]/);
    if (start > 0) {
      try {
        return JSON.parse(trimmed.slice(start));
      } catch {
        // fall through
      }
    }
    throw new WooError("bad_response", "WooCommerce returned a response that isn't valid JSON.");
  }
}

function cleanMessage(message: unknown): string | null {
  if (typeof message !== "string" || !message.trim()) return null;
  return decodeEntities(message.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function errorFor(status: number, body: unknown): WooError {
  const payload = (body && typeof body === "object" ? body : {}) as {
    code?: unknown;
    message?: unknown;
  };
  const code = typeof payload.code === "string" ? payload.code : null;
  const wooMessage = cleanMessage(payload.message);

  if (status === 401) {
    return new WooError(
      "unauthorized",
      wooMessage
        ? `WooCommerce rejected the request: ${wooMessage}`
        : "WooCommerce rejected the API keys.",
      status,
      code
    );
  }
  if (status === 403) {
    return new WooError(
      "forbidden",
      wooMessage ?? "The WooCommerce API key isn't allowed to do this.",
      status,
      code
    );
  }
  if (status === 404) {
    return new WooError("not_found", wooMessage ?? "Not found in WooCommerce.", status, code);
  }
  if (status === 429) {
    return new WooError("rate_limited", "WooCommerce is limiting requests. Try again in a minute.", status, code);
  }
  if (status >= 500) {
    return new WooError(
      "unavailable",
      `WooCommerce is having trouble right now (HTTP ${status}). Try again shortly.`,
      status,
      code
    );
  }
  return new WooError(
    "invalid_request",
    wooMessage ?? `WooCommerce couldn't process the request (HTTP ${status}).`,
    status,
    code
  );
}

export async function wooRequest<T>(
  path: string,
  options: WooRequestOptions = {}
): Promise<WooResponse<T>> {
  const method = options.method ?? "GET";
  const creds = options.anonymous ? null : wooCredentials();
  if (!options.anonymous && !creds) {
    throw new WooError(
      "not_configured",
      "WooCommerce isn't connected yet. Add WOO_CONSUMER_KEY and WOO_CONSUMER_SECRET to the environment."
    );
  }

  const url = buildUrl(path, options);
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Cache-Control": "no-cache",
  };
  if (creds?.authMode === "query") {
    url.searchParams.set("consumer_key", creds.consumerKey);
    url.searchParams.set("consumer_secret", creds.consumerSecret);
  } else if (creds) {
    headers.Authorization = `Basic ${Buffer.from(`${creds.consumerKey}:${creds.consumerSecret}`).toString("base64")}`;
  }
  let body: string | undefined;
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const canRetry = method === "GET";
  for (let attempt = 1; ; attempt++) {
    const last = !canRetry || attempt >= MAX_ATTEMPTS;
    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers,
        body,
        cache: "no-store",
        // A redirected POST/PUT turns into a GET and would look like a
        // successful write. Only reads may follow redirects.
        redirect: canRetry ? "follow" : "manual",
        signal: AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      });
    } catch (cause) {
      const timedOut = (cause as Error)?.name === "TimeoutError";
      if (!last) {
        await sleep(backoffMs(attempt));
        continue;
      }
      throw timedOut
        ? new WooError(
            "timeout",
            method === "GET"
              ? "WooCommerce took too long to respond. Try again."
              : "WooCommerce took too long to respond. The change may still have been saved — refresh before trying again."
          )
        : new WooError("network", `Couldn't reach ${wpOrigin()}. Check WP_ORIGIN and that the site is up.`);
    }

    if (RETRYABLE_STATUS.has(res.status) && !last) {
      await res.body?.cancel();
      await sleep(backoffMs(attempt, res));
      continue;
    }

    if (res.status >= 300 && res.status < 400) {
      await res.body?.cancel();
      let target = "another address";
      try {
        target = new URL(res.headers.get("location") ?? "", url).origin;
      } catch {
        // keep the generic wording
      }
      throw new WooError(
        "invalid_request",
        `WooCommerce redirected the request to ${target}. Set WP_ORIGIN to the site's final address.`,
        res.status
      );
    }

    const text = await res.text();
    const data = res.ok ? parseBody(text) : safeParse(text);
    if (!res.ok) throw errorFor(res.status, data);

    const total = Number(res.headers.get("x-wp-total"));
    const totalPages = Number(res.headers.get("x-wp-totalpages"));
    return {
      data: data as T,
      total: res.headers.has("x-wp-total") && Number.isFinite(total) ? total : null,
      totalPages: res.headers.has("x-wp-totalpages") && Number.isFinite(totalPages) ? totalPages : null,
    };
  }
}

function safeParse(text: string): unknown {
  try {
    return parseBody(text);
  } catch {
    return null;
  }
}

export async function woo<T>(path: string, options?: WooRequestOptions): Promise<T> {
  return (await wooRequest<T>(path, options)).data;
}

/** A WooError reduced to what a page needs to render it (serializable). */
export interface WooProblem {
  kind: WooErrorKind;
  message: string;
  hint: string | null;
}

const HINTS: Partial<Record<WooErrorKind, string>> = {
  not_configured:
    "Create a Read/Write REST API key in WooCommerce → Settings → Advanced → REST API, then set WOO_CONSUMER_KEY and WOO_CONSUMER_SECRET.",
  unauthorized:
    "Check the consumer key and secret. If they are correct, your host may strip the Authorization header: set WOO_AUTH_MODE=query.",
  forbidden:
    "The key's WordPress user must be an Administrator or Shop manager, and the key needs Read/Write permission.",
  network: "Check WP_ORIGIN and that the WordPress site is reachable from this server.",
};

export function toProblem(err: unknown): WooProblem {
  if (err instanceof WooError) {
    return { kind: err.kind, message: err.message, hint: HINTS[err.kind] ?? null };
  }
  console.error("[admin] unexpected WooCommerce error", err);
  return {
    kind: "bad_response",
    message: "Something went wrong talking to WooCommerce.",
    hint: null,
  };
}

/** Run a read and capture a WooError as a renderable problem instead of throwing. */
export async function settle<T>(
  promise: Promise<T>
): Promise<{ ok: true; value: T } | { ok: false; problem: WooProblem }> {
  try {
    return { ok: true, value: await promise };
  } catch (err) {
    if (err instanceof WooError) return { ok: false, problem: toProblem(err) };
    throw err;
  }
}
