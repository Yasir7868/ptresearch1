/**
 * lib/admin/woo/analytics.ts — SERVER-ONLY. Dashboard figures from
 * WooCommerce Analytics (wc-analytics), the same source the WooCommerce
 * mobile app's "My store" screen uses, so the numbers agree with the app and
 * WP admin → Analytics (including its "Actionable statuses" and date-type
 * settings).
 *
 * Analytics works in the store's local time. The store's timezone comes from
 * the public WordPress REST index; day boundaries are computed in that zone.
 *
 * Everything here is memoized for a few minutes and dropped by order/product
 * webhooks; the dashboard's Refresh also passes force_cache_refresh through to
 * WooCommerce's own analytics cache.
 */

import "server-only";
import { memo } from "../memo";
import { toMinor } from "../money";
import { getCatalogIndex } from "./catalog-index";
import { woo } from "./client";
import { getStoreCurrency } from "./orders";
import type { WooProductReportRow, WooRevenueStats, WooStockRow, WooStockStats } from "./types";

// ---------------------------------------------------------------------------
// Store clock
// ---------------------------------------------------------------------------

export interface SiteClock {
  timeZone: string | null;
  gmtOffsetMinutes: number;
}

function validTimeZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

export async function getSiteClock(): Promise<SiteClock> {
  try {
    const { value } = await memo("site-clock", { ttlMs: 6 * 60 * 60 * 1000, tags: ["settings"] }, () =>
      woo<{ gmt_offset?: string | number; timezone_string?: string }>("", {
        namespace: null,
        anonymous: true,
        query: { _fields: "gmt_offset,timezone_string" },
      })
    );
    const zone = value.timezone_string?.trim();
    return {
      timeZone: zone && validTimeZone(zone) ? zone : null,
      gmtOffsetMinutes: Math.round(Number(value.gmt_offset ?? 0) * 60) || 0,
    };
  } catch {
    return { timeZone: null, gmtOffsetMinutes: 0 };
  }
}

/** "YYYY-MM-DD" for a moment, in the store's timezone. */
export function localDateKey(date: Date, clock: SiteClock): string {
  if (clock.timeZone) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: clock.timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
    return `${get("year")}-${get("month")}-${get("day")}`;
  }
  return new Date(date.getTime() + clock.gmtOffsetMinutes * 60_000).toISOString().slice(0, 10);
}

/** Calendar arithmetic on "YYYY-MM-DD" keys (no timezone involved). */
export function addDays(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d! + days)).toISOString().slice(0, 10);
}

function offsetMinutesAt(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const wall = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((wall - instant.getTime()) / 60_000);
}

/** The UTC instant of midnight at the start of a store-local day. */
export function storeMidnightUtc(key: string, clock: SiteClock): Date {
  const [y, m, d] = key.split("-").map(Number);
  const wallMidnight = Date.UTC(y!, m! - 1, d!);
  const offset = clock.timeZone
    ? offsetMinutesAt(new Date(wallMidnight), clock.timeZone)
    : clock.gmtOffsetMinutes;
  return new Date(wallMidnight - offset * 60_000);
}

/** UTC bounds covering store-local days `from`..`to` inclusive. */
export function storeDaysUtc(from: string, to: string, clock: SiteClock): { after: string; before: string } {
  return {
    after: storeMidnightUtc(from, clock).toISOString(),
    before: storeMidnightUtc(addDays(to, 1), clock).toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Sales
// ---------------------------------------------------------------------------

export type SalesRange = "today" | "7d" | "30d";
export const SALES_RANGES: readonly SalesRange[] = ["today", "7d", "30d"];

const HISTORY_DAYS = 60;

export interface DailySales {
  date: string;
  salesMinor: number;
  netMinor: number;
  orders: number;
  items: number;
}

export interface SalesTotals {
  salesMinor: number;
  netMinor: number;
  orders: number;
  items: number;
  averageMinor: number;
}

export interface SalesSummary {
  range: SalesRange;
  today: string;
  currency: string;
  current: SalesTotals;
  previous: SalesTotals;
  /** Days plotted for the range (today shows the last 7 with today last). */
  series: DailySales[];
  storedAt: number;
}

async function loadDailySales(today: string, force: boolean): Promise<DailySales[]> {
  const start = addDays(today, -(HISTORY_DAYS - 1));
  const stats = await woo<WooRevenueStats>("/reports/revenue/stats", {
    namespace: "wc-analytics",
    query: {
      interval: "day",
      after: `${start}T00:00:00`,
      before: `${today}T23:59:59`,
      per_page: 100,
      orderby: "date",
      order: "asc",
      force_cache_refresh: force || undefined,
    },
  });

  const byDate = new Map<string, DailySales>();
  for (const interval of stats.intervals ?? []) {
    const date = (interval.date_start ?? interval.interval).slice(0, 10);
    const s = interval.subtotals;
    byDate.set(date, {
      date,
      salesMinor: toMinor(s.total_sales),
      netMinor: toMinor(s.net_revenue),
      orders: Number(s.orders_count) || 0,
      items: Number(s.num_items_sold) || 0,
    });
  }

  const days: DailySales[] = [];
  for (let i = HISTORY_DAYS - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    days.push(byDate.get(date) ?? { date, salesMinor: 0, netMinor: 0, orders: 0, items: 0 });
  }
  return days;
}

function totalsOf(days: DailySales[]): SalesTotals {
  const t = days.reduce(
    (acc, d) => ({
      salesMinor: acc.salesMinor + d.salesMinor,
      netMinor: acc.netMinor + d.netMinor,
      orders: acc.orders + d.orders,
      items: acc.items + d.items,
    }),
    { salesMinor: 0, netMinor: 0, orders: 0, items: 0 }
  );
  return { ...t, averageMinor: t.orders ? Math.round(t.salesMinor / t.orders) : 0 };
}

export const RANGE_DAYS: Record<SalesRange, number> = { today: 1, "7d": 7, "30d": 30 };

export async function getSalesSummary(range: SalesRange, options: { force?: boolean } = {}): Promise<SalesSummary> {
  const clock = await getSiteClock();
  const today = localDateKey(new Date(), clock);
  const [{ value: days, storedAt }, currency] = await Promise.all([
    memo(`sales:${today}`, { ttlMs: 5 * 60 * 1000, tags: ["orders"], force: options.force }, () =>
      loadDailySales(today, Boolean(options.force))
    ),
    getStoreCurrency(),
  ]);

  const n = RANGE_DAYS[range];
  const current = days.slice(-n);
  const previous = days.slice(-2 * n, -n);
  return {
    range,
    today,
    currency,
    current: totalsOf(current),
    previous: totalsOf(previous),
    series: days.slice(-Math.max(n, 7)),
    storedAt,
  };
}

// ---------------------------------------------------------------------------
// Top products
// ---------------------------------------------------------------------------

export interface TopProduct {
  productId: number;
  name: string;
  itemsSold: number;
  netMinor: number;
  orders: number;
  image: string | null;
}

export async function getTopProducts(range: SalesRange, options: { force?: boolean } = {}): Promise<TopProduct[]> {
  const clock = await getSiteClock();
  const today = localDateKey(new Date(), clock);
  const start = addDays(today, -(RANGE_DAYS[range] - 1));
  const [{ value: rows }, index] = await Promise.all([
    memo(`top-products:${range}:${today}`, { ttlMs: 5 * 60 * 1000, tags: ["orders", "products"], force: options.force }, () =>
      woo<WooProductReportRow[]>("/reports/products", {
        namespace: "wc-analytics",
        query: {
          after: `${start}T00:00:00`,
          before: `${today}T23:59:59`,
          orderby: "items_sold",
          order: "desc",
          per_page: 5,
          extended_info: true,
          force_cache_refresh: options.force || undefined,
        },
      })
    ),
    getCatalogIndex(),
  ]);
  return rows
    .filter((r) => r.items_sold > 0)
    .map((r) => ({
      productId: r.product_id,
      name: index.productName(r.product_id, r.extended_info?.name ?? `Product #${r.product_id}`),
      itemsSold: Number(r.items_sold) || 0,
      netMinor: toMinor(r.net_revenue),
      orders: Number(r.orders_count) || 0,
      image: index.imageFor(r.product_id),
    }));
}

// ---------------------------------------------------------------------------
// Stock
// ---------------------------------------------------------------------------

export interface StockAlert {
  id: number;
  productId: number;
  name: string;
  sku: string;
  status: string;
  quantity: number | null;
}

export interface StockOverview {
  lowCount: number;
  outCount: number;
  backorderCount: number;
  alerts: StockAlert[];
}

export async function getStockOverview(options: { force?: boolean } = {}): Promise<StockOverview> {
  const [{ value }, index] = await Promise.all([
    memo("stock-overview", { ttlMs: 5 * 60 * 1000, tags: ["products"], force: options.force }, async () => {
      const [stats, out, low] = await Promise.all([
        woo<WooStockStats>("/reports/stock/stats", { namespace: "wc-analytics" }),
        woo<WooStockRow[]>("/reports/stock", {
          namespace: "wc-analytics",
          query: { type: "outofstock", per_page: 6, orderby: "title", order: "asc" },
        }),
        woo<WooStockRow[]>("/reports/stock", {
          namespace: "wc-analytics",
          query: { type: "lowstock", per_page: 6, orderby: "stock_quantity", order: "asc" },
        }),
      ]);
      return { stats, rows: [...out, ...low] };
    }),
    getCatalogIndex(),
  ]);

  return {
    lowCount: value.stats.totals?.lowstock ?? 0,
    outCount: value.stats.totals?.outofstock ?? 0,
    backorderCount: value.stats.totals?.onbackorder ?? 0,
    alerts: value.rows.slice(0, 8).map((row) => ({
      id: row.id,
      productId: row.parent_id || row.id,
      name: row.parent_id ? index.code(row.name) : index.productName(row.id, row.name),
      sku: row.sku ?? "",
      status: row.stock_status,
      quantity: row.stock_quantity,
    })),
  };
}
