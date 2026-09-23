/**
 * lib/admin/rate-limit.ts — SERVER-ONLY. Fixed-window, in-memory request
 * limits for the unauthenticated admin forms (sign-in, setup, invite and reset
 * links). Per-account lockout lives in the database (lib/admin/users.ts); this
 * layer slows down one source hammering many accounts.
 *
 * In-memory is enough here: the admin database is SQLite, so the app runs as
 * a single instance.
 */

import "server-only";

interface Bucket {
  count: number;
  resetAt: number;
}

const globalForLimits = globalThis as typeof globalThis & {
  __ptAdminRateLimits?: Map<string, Bucket>;
};
const buckets: Map<string, Bucket> = (globalForLimits.__ptAdminRateLimits ??= new Map<string, Bucket>());

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  return bucket.count > limit
    ? { allowed: false, retryAfterMs: bucket.resetAt - now }
    : { allowed: true, retryAfterMs: 0 };
}
