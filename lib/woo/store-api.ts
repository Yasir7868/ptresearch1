/**
 * lib/woo/store-api.ts — SERVER-ONLY fetch helpers for the WooCommerce
 * Store API (public, read-only): https://ptresearch.shop/wp-json/wc/store/v1
 *
 * These run in Server Components / route handlers only. They must never be
 * imported into a client component (they carry no secrets, but the caching
 * semantics and error handling assume a server runtime).
 *
 * Caching (Next 16): the catalog is stable, so reads opt into the Data Cache
 * with a 24h revalidate and tag-based invalidation. Failures are NEVER cached —
 * a non-2xx response throws a typed StoreApiError before any value is returned.
 *
 * Retries: the store runs on shared hosting and returns sporadic 5xx/429 under
 * parallel build traffic, so transient statuses are retried up to MAX_ATTEMPTS
 * times with jittered backoff (honoring Retry-After). Each attempt carries its
 * own AbortSignal, which is also what opts it out of React's per-request fetch
 * memoization — without that, attempts 2+ would receive a clone of attempt 1.
 */

import type { StoreApiProduct } from "./types";

/** Base origin of the live store. Override with WP_ORIGIN. */
const WP_ORIGIN = (process.env.WP_ORIGIN || "https://ptresearch.shop").replace(
  /\/+$/,
  ""
);

const STORE_API_BASE = `${WP_ORIGIN}/wp-json/wc/store/v1`;

/** One day, in seconds — the catalog revalidation window. */
const CATALOG_REVALIDATE_SECONDS = 86_400;

/** Typed error for any Store API failure. Message is UI-safe. */
export class StoreApiError extends Error {
  readonly status: number;
  readonly url: string;

  constructor(message: string, status: number, url: string) {
    super(message);
    this.name = "StoreApiError";
    this.status = status;
    this.url = url;
  }
}

interface FetchOptions {
  tags: string[];
  revalidate?: number;
}

/** Transient statuses worth retrying. */
const RETRY_STATUSES = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 4;
/** Per-attempt request timeout. */
const ATTEMPT_TIMEOUT_MS = 15_000;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Backoff for the attempt just failed: Retry-After when sent, else 500ms doubling with ±20% jitter. */
function backoffMs(attempt: number, res: Response | undefined): number {
  const retryAfter = Number(res?.headers.get("retry-after"));
  if (Number.isFinite(retryAfter) && retryAfter > 0) return retryAfter * 1000;
  const base = 500 * 2 ** (attempt - 1);
  return Math.round(base * (0.8 + Math.random() * 0.4));
}

/**
 * Fetch + parse JSON from the Store API with tag-based caching and bounded
 * retries on transient failures. Throws a StoreApiError on transport failure
 * or a non-2xx status (never caches a failure — the throw happens before any
 * value is returned/cached).
 */
async function fetchJson<T>(url: string, opts: FetchOptions): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    const last = attempt >= MAX_ATTEMPTS;
    let res: Response;
    try {
      res = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
        next: {
          tags: opts.tags,
          revalidate: opts.revalidate ?? CATALOG_REVALIDATE_SECONDS,
        },
      });
    } catch (cause) {
      if (last) {
        throw new StoreApiError(
          `Store API request failed: ${(cause as Error)?.message ?? "network error"}`,
          0,
          url
        );
      }
      await sleep(backoffMs(attempt, undefined));
      continue;
    }

    if (RETRY_STATUSES.has(res.status) && !last) {
      // Release the pooled connection before waiting.
      await res.body?.cancel();
      await sleep(backoffMs(attempt, res));
      continue;
    }

    if (!res.ok) {
      throw new StoreApiError(
        `Store API responded ${res.status} for ${url}`,
        res.status,
        url
      );
    }

    try {
      return (await res.json()) as T;
    } catch {
      throw new StoreApiError(`Store API returned invalid JSON for ${url}`, res.status, url);
    }
  }
}

/** True when the identifier is a numeric product/variation id. */
function isNumericId(idOrSlug: string | number): boolean {
  return /^\d+$/.test(String(idOrSlug));
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/**
 * All catalog products (per_page=100; the store has a few dozen). Cached under the
 * "catalog" tag with a 24h revalidate.
 */
export async function getProducts(): Promise<StoreApiProduct[]> {
  const url = `${STORE_API_BASE}/products?per_page=100`;
  return fetchJson<StoreApiProduct[]>(url, {
    tags: ["catalog"],
    revalidate: CATALOG_REVALIDATE_SECONDS,
  });
}

/**
 * A single product by numeric id OR slug. Slug lookups use the `?slug=` query
 * (the Store API returns an array; we take the first match). Throws
 * StoreApiError(404) when a slug resolves to nothing.
 */
export async function getProduct(idOrSlug: string | number): Promise<StoreApiProduct> {
  if (isNumericId(idOrSlug)) {
    const url = `${STORE_API_BASE}/products/${idOrSlug}`;
    return fetchJson<StoreApiProduct>(url, { tags: [`product:${idOrSlug}`] });
  }

  const url = `${STORE_API_BASE}/products?slug=${encodeURIComponent(String(idOrSlug))}`;
  const matches = await fetchJson<StoreApiProduct[]>(url, {
    tags: [`product:${idOrSlug}`],
  });
  const first = matches[0];
  if (!first) {
    throw new StoreApiError(`No product found for slug "${idOrSlug}"`, 404, url);
  }
  return first;
}

/**
 * A single variation by id. Returns a Store API record with `type:"variation"`
 * and per-size `prices`. Tagged `product:<id>`.
 */
export async function getVariation(id: string | number): Promise<StoreApiProduct> {
  const url = `${STORE_API_BASE}/products/${id}`;
  return fetchJson<StoreApiProduct>(url, { tags: [`product:${id}`] });
}

/**
 * Many variations in ONE request (`type=variation&include=…`). Cached under
 * the "catalog" tag alongside the product list it enriches.
 */
export async function getVariations(ids: number[]): Promise<StoreApiProduct[]> {
  if (ids.length === 0) return [];
  const url = `${STORE_API_BASE}/products?type=variation&include=${ids.join(",")}&per_page=100`;
  return fetchJson<StoreApiProduct[]>(url, {
    tags: ["catalog"],
    revalidate: CATALOG_REVALIDATE_SECONDS,
  });
}
