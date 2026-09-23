/**
 * lib/admin/woo/customers.ts — SERVER-ONLY. Customers from WooCommerce
 * Analytics, which (unlike wc/v3/customers) includes guest checkouts and each
 * customer's order count and spend — the same list as WP admin → Customers.
 */

import "server-only";
import { toMinor } from "../money";
import { getCatalogIndex } from "./catalog-index";
import { woo, wooRequest, WooError } from "./client";
import { getStoreCurrency, listOrders, type OrderRow } from "./orders";
import type { WooAnalyticsCustomer } from "./types";

export type CustomerType = "all" | "registered" | "guest";
export type CustomerSort = "date_last_active" | "total_spend" | "orders_count" | "name";

export interface CustomerRow {
  id: number;
  userId: number;
  name: string;
  email: string;
  username: string;
  location: string;
  registeredAt: string | null;
  lastActiveAt: string | null;
  lastOrderAt: string | null;
  ordersCount: number;
  totalSpendMinor: number;
  averageMinor: number;
  currency: string;
}

function gmtIso(value: string | null | undefined): string | null {
  if (!value) return null;
  return /[zZ]|[+-]\d\d:\d\d$/.test(value) ? value : `${value.replace(" ", "T")}Z`;
}

function toRow(c: WooAnalyticsCustomer, code: (s: string) => string, currency: string): CustomerRow {
  return {
    id: c.id,
    userId: c.user_id ?? 0,
    name: code((c.name ?? "").trim()) || c.email || "Unnamed customer",
    email: c.email ?? "",
    username: c.username ?? "",
    location: [c.city, c.state, c.country].filter(Boolean).join(", "),
    registeredAt: gmtIso(c.date_registered_gmt),
    lastActiveAt: gmtIso(c.date_last_active_gmt),
    // date_last_order is store-local; shown as a date only.
    lastOrderAt: c.date_last_order ? c.date_last_order.slice(0, 10) : null,
    ordersCount: Number(c.orders_count) || 0,
    totalSpendMinor: toMinor(c.total_spend),
    averageMinor: toMinor(c.avg_order_value),
    currency,
  };
}

export async function listCustomers(filter: {
  search?: string;
  type: CustomerType;
  sort: CustomerSort;
  page: number;
  perPage: number;
}): Promise<{ rows: CustomerRow[]; total: number; totalPages: number }> {
  const [res, index, currency] = await Promise.all([
    wooRequest<WooAnalyticsCustomer[]>("/reports/customers", {
      namespace: "wc-analytics",
      query: {
        search: filter.search,
        searchby: filter.search ? "all" : undefined,
        user_type: filter.type === "all" ? undefined : filter.type,
        orderby: filter.sort,
        order: filter.sort === "name" ? "asc" : "desc",
        page: filter.page,
        per_page: filter.perPage,
      },
    }),
    getCatalogIndex(),
    getStoreCurrency(),
  ]);
  return {
    rows: res.data.map((c) => toRow(c, index.code, currency)),
    total: res.total ?? res.data.length,
    totalPages: res.totalPages ?? 1,
  };
}

export async function getCustomer(id: number): Promise<CustomerRow | null> {
  try {
    const [customer, index, currency] = await Promise.all([
      woo<WooAnalyticsCustomer>(`/customers/${id}`, { namespace: "wc-analytics" }),
      getCatalogIndex(),
      getStoreCurrency(),
    ]);
    return customer?.id ? toRow(customer, index.code, currency) : null;
  } catch (err) {
    if (err instanceof WooError && (err.kind === "not_found" || err.kind === "invalid_request")) return null;
    throw err;
  }
}

/** A customer's orders: by account when registered, by email for guests. */
export async function listCustomerOrders(
  customer: CustomerRow,
  page: number
): Promise<{ rows: OrderRow[]; total: number; totalPages: number }> {
  if (customer.userId > 0) {
    return listOrders({ status: "all", page, perPage: 20, customerId: customer.userId });
  }
  if (!customer.email) return { rows: [], total: 0, totalPages: 1 };
  const result = await listOrders({ status: "all", page, perPage: 20, search: customer.email });
  // Search also matches notes and addresses; keep exact email matches only.
  const rows = result.rows.filter((r) => r.email.toLowerCase() === customer.email.toLowerCase());
  return { ...result, rows };
}
