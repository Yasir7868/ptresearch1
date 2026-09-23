/**
 * lib/admin/memo.ts — SERVER-ONLY. A small in-process cache for the slower
 * WooCommerce reads (dashboard analytics, status counts, the product index).
 *
 * Why not the Next.js Data Cache: these responses contain customer data, and
 * the Data Cache persists to disk. This cache lives in memory only, entries
 * expire on a short TTL, and webhooks/Server Actions drop them by tag the
 * moment WooCommerce reports a change. Concurrent callers share one in-flight
 * request. Failures are never cached.
 */

import "server-only";

interface Entry {
  value: unknown;
  storedAt: number;
  expiresAt: number;
  tags: readonly string[];
}

interface MemoStore {
  entries: Map<string, Entry>;
  inflight: Map<string, Promise<unknown>>;
}

const globalForMemo = globalThis as typeof globalThis & { __ptAdminMemo?: MemoStore };
const store: MemoStore = (globalForMemo.__ptAdminMemo ??= {
  entries: new Map<string, Entry>(),
  inflight: new Map<string, Promise<unknown>>(),
});

export async function memo<T>(
  key: string,
  options: { ttlMs: number; tags: readonly string[]; force?: boolean },
  load: () => Promise<T>
): Promise<{ value: T; storedAt: number }> {
  const now = Date.now();
  const hit = store.entries.get(key);
  if (!options.force && hit && hit.expiresAt > now) {
    return { value: hit.value as T, storedAt: hit.storedAt };
  }

  const pending = store.inflight.get(key);
  if (pending && !options.force) {
    const value = (await pending) as T;
    return { value, storedAt: store.entries.get(key)?.storedAt ?? Date.now() };
  }

  const request = load();
  store.inflight.set(key, request);
  try {
    const value = await request;
    const storedAt = Date.now();
    store.entries.set(key, {
      value,
      storedAt,
      expiresAt: storedAt + options.ttlMs,
      tags: options.tags,
    });
    return { value, storedAt };
  } finally {
    if (store.inflight.get(key) === request) store.inflight.delete(key);
  }
}

/** Drop every entry carrying any of the given tags. */
export function invalidate(...tags: string[]): void {
  if (tags.length === 0) return;
  for (const [key, entry] of store.entries) {
    if (entry.tags.some((t) => tags.includes(t))) store.entries.delete(key);
  }
}
