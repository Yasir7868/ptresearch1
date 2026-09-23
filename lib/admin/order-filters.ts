/**
 * lib/admin/order-filters.ts — SERVER-ONLY. Turns the orders list URL
 * (?status=&q=&range=&from=&to=&page=&per_page=) into WooCommerce query
 * filters. Shared by the orders page and the CSV export so both always agree.
 */

import "server-only";
import { CORE_STATUSES } from "./order-status";
import { dateKeyParam, oneOf, pageParam, perPageParam, searchParam, type SearchParams } from "./params";
import { addDays, getSiteClock, localDateKey, storeDaysUtc } from "./woo/analytics";
import { getOrderStatuses, type OrderFilters } from "./woo/orders";

export const DATE_RANGES = ["", "today", "7d", "30d", "90d", "custom"] as const;
export type DateRange = (typeof DATE_RANGES)[number];

export interface ParsedOrderFilters {
  filters: OrderFilters;
  /** The URL-level values, for links and form defaults. */
  ui: { status: string; q: string; range: DateRange; from: string; to: string; perPage: number; page: number };
}

const RANGE_DAYS: Partial<Record<DateRange, number>> = { today: 1, "7d": 7, "30d": 30, "90d": 90 };

export async function parseOrderFilters(params: SearchParams): Promise<ParsedOrderFilters> {
  let slugs: string[];
  try {
    slugs = (await getOrderStatuses()).map((s) => s.slug);
  } catch {
    slugs = Object.keys(CORE_STATUSES);
  }
  const status = oneOf(params, "status", ["all", ...slugs], "all");
  const q = searchParam(params);
  const range = oneOf(params, "range", DATE_RANGES, "");
  const from = dateKeyParam(params, "from");
  const to = dateKeyParam(params, "to");
  const page = pageParam(params);
  const perPage = perPageParam(params);

  const filters: OrderFilters = { status, page, perPage, search: q || undefined };

  if (range) {
    const clock = await getSiteClock();
    const today = localDateKey(new Date(), clock);
    const days = RANGE_DAYS[range];
    if (days) {
      Object.assign(filters, storeDaysUtc(addDays(today, -(days - 1)), today, clock));
    } else if (range === "custom" && (from || to)) {
      const start = from ?? "2000-01-01";
      const end = to && (!from || to >= from) ? to : today;
      Object.assign(filters, storeDaysUtc(start, end, clock));
    }
  }

  return { filters, ui: { status, q, range, from: from ?? "", to: to ?? "", perPage, page } };
}

/** The URL params that describe the current list (for pagination/export links). */
export function listParams(ui: ParsedOrderFilters["ui"]): Record<string, string | undefined> {
  return {
    status: ui.status === "all" ? undefined : ui.status,
    q: ui.q || undefined,
    range: ui.range || undefined,
    from: ui.range === "custom" ? ui.from || undefined : undefined,
    to: ui.range === "custom" ? ui.to || undefined : undefined,
    per_page: ui.perPage === 20 ? undefined : String(ui.perPage),
  };
}
