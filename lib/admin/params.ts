/**
 * lib/admin/params.ts — reading admin list-page search params safely.
 * Anything unexpected falls back to a default; nothing is trusted as-is.
 */

export type SearchParams = Record<string, string | string[] | undefined>;

export function one(params: SearchParams, key: string): string {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export function pageParam(params: SearchParams): number {
  const n = Number(one(params, "page"));
  return Number.isInteger(n) && n > 0 && n <= 10_000 ? n : 1;
}

export const PER_PAGE_OPTIONS = [20, 50, 100] as const;

export function perPageParam(params: SearchParams, fallback = 20): number {
  const n = Number(one(params, "per_page"));
  return (PER_PAGE_OPTIONS as readonly number[]).includes(n) ? n : fallback;
}

export function oneOf<T extends string>(params: SearchParams, key: string, allowed: readonly T[], fallback: T): T {
  const value = one(params, key) as T;
  return allowed.includes(value) ? value : fallback;
}

export function dateKeyParam(params: SearchParams, key: string): string | null {
  const value = one(params, key);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : value;
}

export function searchParam(params: SearchParams, key = "q"): string {
  return one(params, key).slice(0, 100);
}
