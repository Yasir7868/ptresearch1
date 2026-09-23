/**
 * lib/admin/woo/orders.ts — SERVER-ONLY. Orders, read and written through the
 * WooCommerce REST API — the same orders WP admin and the WooCommerce mobile
 * app show. A status changed here shows in the app, and the other way round.
 *
 * Reads return view models (DTOs) that are safe to hand to client components:
 * money in minor units, product names coded, HTML stripped from notes.
 *
 * Status counts and the newest orders are memoized for a few seconds (they
 * back the sidebar badge and the new-order poller for every signed-in tab);
 * everything else is fetched live. Webhooks and Server Actions drop the memo
 * the moment something changes.
 */

import "server-only";
import { containsExpandedGlpName, decodeEntities } from "@/lib/woo/mapper";
import { invalidate, memo } from "../memo";
import { toMinor } from "../money";
import { CORE_STATUSES, HIDDEN_FROM_ALL, STATUS_ORDER } from "../order-status";
import { wpOrigin } from "../config";
import { getCatalogIndex, type CatalogIndex } from "./catalog-index";
import { woo, wooRequest, WooError } from "./client";
import type {
  WooAddress,
  WooCurrency,
  WooMeta,
  WooOrder,
  WooOrderNote,
  WooOrderStatus,
  WooPaymentGateway,
  WooRefund,
  WooStatusTotal,
} from "./types";

// ---------------------------------------------------------------------------
// View models
// ---------------------------------------------------------------------------

export interface OrderRow {
  id: number;
  number: string;
  status: string;
  createdAt: string | null;
  customerName: string;
  email: string;
  itemCount: number;
  itemsSummary: string;
  totalMinor: number;
  currency: string;
  paymentMethod: string;
  shipTo: string;
  createdVia: string;
}

export interface AddressView {
  firstName: string;
  lastName: string;
  company: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email: string;
  phone: string;
  /** Printable lines, empty parts dropped. */
  lines: string[];
}

export interface OrderItemView {
  id: number;
  productId: number;
  variationId: number;
  name: string;
  variant: string | null;
  sku: string | null;
  quantity: number;
  unitMinor: number;
  subtotalMinor: number;
  totalMinor: number;
  image: string | null;
}

export interface OrderView {
  id: number;
  number: string;
  status: string;
  currency: string;
  createdVia: string;
  createdAt: string | null;
  modifiedAt: string | null;
  paidAt: string | null;
  completedAt: string | null;
  customerId: number;
  customerNote: string;
  customerIp: string;
  customerUserAgent: string;
  billing: AddressView;
  shipping: AddressView;
  paymentMethodId: string;
  paymentMethodTitle: string;
  transactionId: string;
  items: OrderItemView[];
  shippingLines: { id: number; title: string; totalMinor: number }[];
  feeLines: { id: number; name: string; totalMinor: number }[];
  couponLines: { id: number; code: string; discountMinor: number }[];
  taxLines: { id: number; label: string; totalMinor: number }[];
  totals: {
    itemsSubtotalMinor: number;
    discountMinor: number;
    shippingMinor: number;
    feesMinor: number;
    taxMinor: number;
    totalMinor: number;
    refundedMinor: number;
    netMinor: number;
  };
  needsPayment: boolean;
  wpAdminUrl: string;
}

export interface OrderNoteView {
  id: number;
  author: string;
  createdAt: string | null;
  body: string;
  kind: "customer" | "private" | "system";
}

export interface RefundView {
  id: number;
  createdAt: string | null;
  amountMinor: number;
  reason: string;
  refundedPayment: boolean;
}

export interface OrderFilters {
  /** "all" or a status slug. */
  status: string;
  search?: string;
  page: number;
  perPage: number;
  /** ISO timestamps (UTC). */
  after?: string;
  before?: string;
  customerId?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LIST_FIELDS =
  "id,number,status,currency,date_created_gmt,total,billing,shipping,payment_method_title,line_items,customer_id,created_via";

/** WooCommerce GMT timestamps come without a zone suffix. */
function gmtIso(value: string | null | undefined): string | null {
  if (!value) return null;
  return /[zZ]|[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`;
}

function stripHtml(html: string): string {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function toAddress(a: Partial<WooAddress> | undefined, code: (s: string) => string): AddressView {
  const v = (s?: string) => code((s ?? "").trim());
  const view = {
    firstName: v(a?.first_name),
    lastName: v(a?.last_name),
    company: v(a?.company),
    address1: v(a?.address_1),
    address2: v(a?.address_2),
    city: v(a?.city),
    state: v(a?.state),
    postcode: v(a?.postcode),
    country: v(a?.country),
    email: (a?.email ?? "").trim(),
    phone: (a?.phone ?? "").trim(),
  };
  const name = [view.firstName, view.lastName].filter(Boolean).join(" ");
  const cityLine = [view.city, [view.state, view.postcode].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  return {
    ...view,
    lines: [name, view.company, view.address1, view.address2, cityLine, view.country].filter(Boolean),
  };
}

function customerName(order: Pick<WooOrder, "billing" | "shipping">): string {
  const billing = [order.billing?.first_name, order.billing?.last_name].filter(Boolean).join(" ").trim();
  if (billing) return billing;
  const shipping = [order.shipping?.first_name, order.shipping?.last_name].filter(Boolean).join(" ").trim();
  return shipping || order.billing?.company || order.billing?.email || "Guest";
}

function variantLabel(meta: WooMeta[] | undefined): string | null {
  const parts = (meta ?? [])
    .filter((m) => !m.key.startsWith("_") && m.display_value !== undefined && m.display_value !== null)
    .filter((m) => typeof m.display_value === "string" || typeof m.display_value === "number")
    .map((m) => {
      const key = stripHtml(String(m.display_key ?? m.key));
      const value = stripHtml(String(m.display_value));
      return value ? (key ? `${key}: ${value}` : value) : "";
    })
    .filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

function toRow(order: WooOrder, index: CatalogIndex): OrderRow {
  const items = order.line_items ?? [];
  const itemCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const first = items[0];
  const firstName = first ? index.productName(first.product_id, first.parent_name || first.name) : "";
  const itemsSummary = first
    ? items.length > 1
      ? `${firstName} and ${items.length - 1} more`
      : `${firstName}${first.quantity > 1 ? ` × ${first.quantity}` : ""}`
    : "No items";
  const place = order.shipping?.city ? order.shipping : order.billing;
  return {
    id: order.id,
    number: String(order.number || order.id),
    status: order.status,
    createdAt: gmtIso(order.date_created_gmt),
    customerName: index.code(customerName(order)),
    email: order.billing?.email ?? "",
    itemCount,
    itemsSummary,
    totalMinor: toMinor(order.total),
    currency: order.currency || "USD",
    paymentMethod: order.payment_method_title ?? "",
    shipTo: [place?.city, place?.state].filter(Boolean).join(", "),
    createdVia: order.created_via ?? "",
  };
}

export function wpAdminOrderUrl(orderId: number): string {
  // WooCommerce redirects this legacy URL to the HPOS order screen when HPOS is on.
  return `${wpOrigin()}/wp-admin/post.php?post=${orderId}&action=edit`;
}

export function invalidateOrders(): void {
  invalidate("orders");
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/** Every status the store knows, in WooCommerce's order. */
export async function getOrderStatuses(): Promise<WooOrderStatus[]> {
  const { value } = await memo("order-statuses", { ttlMs: 60 * 60 * 1000, tags: ["statuses"] }, async () => {
    try {
      const statuses = await woo<WooOrderStatus[]>("/orders/statuses");
      if (Array.isArray(statuses) && statuses.length) return statuses;
    } catch (err) {
      // Stores older than WooCommerce 9.x don't have this endpoint.
      if (!(err instanceof WooError) || err.kind !== "not_found") throw err;
    }
    return Object.entries(CORE_STATUSES).map(([slug, meta]) => ({ slug, name: meta.label }));
  });
  const rank = (slug: string) => {
    const i = STATUS_ORDER.indexOf(slug);
    return i === -1 ? STATUS_ORDER.length : i;
  };
  return [...value].sort((a, b) => rank(a.slug) - rank(b.slug));
}

/** Status slugs that make up "All" (drafts and trash excluded, like WP admin). */
async function allStatusSlugs(): Promise<string[]> {
  return (await getOrderStatuses()).map((s) => s.slug).filter((slug) => !HIDDEN_FROM_ALL.has(slug));
}

/** The `status` query value for a list filter ("all" or one slug). */
export async function statusQuery(status: string): Promise<string[]> {
  return status === "all" ? allStatusSlugs() : [status];
}

/** Order count per status, plus "all". The same report the WooCommerce app uses. */
export async function getStatusCounts(options: { force?: boolean } = {}): Promise<Record<string, number>> {
  const [{ value: totals }, visible] = await Promise.all([
    memo("status-counts", { ttlMs: 20_000, tags: ["orders"], force: options.force }, () =>
      woo<WooStatusTotal[]>("/reports/orders/totals")
    ),
    allStatusSlugs(),
  ]);
  const counts: Record<string, number> = { all: 0 };
  for (const row of totals) {
    counts[row.slug] = row.total;
    if (visible.includes(row.slug)) counts.all += row.total;
  }
  return counts;
}

export async function listOrders(
  filters: OrderFilters
): Promise<{ rows: OrderRow[]; total: number; totalPages: number }> {
  const status = await statusQuery(filters.status);
  const [res, index] = await Promise.all([
    wooRequest<WooOrder[]>("/orders", {
      query: {
        status,
        search: filters.search,
        page: filters.page,
        per_page: filters.perPage,
        after: filters.after,
        before: filters.before,
        dates_are_gmt: filters.after || filters.before ? true : undefined,
        customer: filters.customerId,
        orderby: "date",
        order: "desc",
        _fields: LIST_FIELDS,
      },
    }),
    getCatalogIndex(),
  ]);
  return {
    rows: res.data.map((o) => toRow(o, index)),
    total: res.total ?? res.data.length,
    totalPages: res.totalPages ?? 1,
  };
}

/** The newest orders, for the dashboard and the new-order poller. */
export async function getLatestOrders(limit = 8, options: { force?: boolean } = {}): Promise<OrderRow[]> {
  const { value } = await memo(
    `latest-orders:${limit}`,
    { ttlMs: 15_000, tags: ["orders"], force: options.force },
    async () => (await listOrders({ status: "all", page: 1, perPage: limit })).rows
  );
  return value;
}

export async function getOrder(orderId: number): Promise<OrderView | null> {
  let order: WooOrder;
  try {
    order = await woo<WooOrder>(`/orders/${orderId}`);
  } catch (err) {
    if (err instanceof WooError && (err.kind === "not_found" || err.code === "woocommerce_rest_shop_order_invalid_id")) {
      return null;
    }
    throw err;
  }
  const index = await getCatalogIndex();
  const code = index.code;

  const items: OrderItemView[] = (order.line_items ?? []).map((item) => {
    const quantity = Number(item.quantity) || 0;
    const totalMinor = toMinor(item.total);
    const remote = item.image?.src || null;
    const variant = variantLabel(item.meta_data);
    return {
      id: item.id,
      productId: item.product_id,
      variationId: item.variation_id,
      name: index.productName(item.product_id, item.parent_name || item.name),
      variant: variant ? code(variant) : null,
      sku: item.sku || null,
      quantity,
      unitMinor: quantity ? Math.round(totalMinor / quantity) : 0,
      subtotalMinor: toMinor(item.subtotal),
      totalMinor,
      image:
        index.imageFor(item.product_id) ??
        (remote && !containsExpandedGlpName(remote) ? remote : null),
    };
  });

  const refundedMinor = (order.refunds ?? []).reduce((sum, r) => sum + Math.abs(toMinor(r.total)), 0);
  const totalMinor = toMinor(order.total);

  return {
    id: order.id,
    number: String(order.number || order.id),
    status: order.status,
    currency: order.currency || "USD",
    createdVia: order.created_via ?? "",
    createdAt: gmtIso(order.date_created_gmt),
    modifiedAt: gmtIso(order.date_modified_gmt),
    paidAt: gmtIso(order.date_paid_gmt),
    completedAt: gmtIso(order.date_completed_gmt),
    customerId: order.customer_id,
    customerNote: code(stripHtml(order.customer_note ?? "")),
    customerIp: order.customer_ip_address ?? "",
    customerUserAgent: order.customer_user_agent ?? "",
    billing: toAddress(order.billing, code),
    shipping: toAddress(order.shipping, code),
    paymentMethodId: order.payment_method ?? "",
    paymentMethodTitle: order.payment_method_title ?? "",
    transactionId: order.transaction_id ?? "",
    items,
    shippingLines: (order.shipping_lines ?? []).map((l) => ({
      id: l.id,
      title: code(stripHtml(l.method_title ?? "")),
      totalMinor: toMinor(l.total),
    })),
    feeLines: (order.fee_lines ?? []).map((l) => ({
      id: l.id,
      name: code(stripHtml(l.name ?? "")),
      totalMinor: toMinor(l.total),
    })),
    couponLines: (order.coupon_lines ?? []).map((l) => ({
      id: l.id,
      code: l.code,
      discountMinor: toMinor(l.discount),
    })),
    taxLines: (order.tax_lines ?? []).map((l) => ({
      id: l.id,
      label: l.label || l.rate_code,
      totalMinor: toMinor(l.tax_total) + toMinor(l.shipping_tax_total),
    })),
    totals: {
      itemsSubtotalMinor: items.reduce((sum, i) => sum + i.subtotalMinor, 0),
      discountMinor: toMinor(order.discount_total),
      shippingMinor: toMinor(order.shipping_total),
      feesMinor: (order.fee_lines ?? []).reduce((sum, l) => sum + toMinor(l.total), 0),
      taxMinor: toMinor(order.total_tax),
      totalMinor,
      refundedMinor,
      netMinor: totalMinor - refundedMinor,
    },
    needsPayment: Boolean(order.needs_payment),
    wpAdminUrl: wpAdminOrderUrl(order.id),
  };
}

export interface OrderSummary {
  id: number;
  number: string;
  status: string;
  totalMinor: number;
  refundedMinor: number;
  currency: string;
  paymentMethodId: string;
}

/** Just enough of an order to validate and describe a change to it. */
export async function getOrderSummary(orderId: number): Promise<OrderSummary | null> {
  try {
    const o = await woo<Pick<WooOrder, "id" | "number" | "status" | "total" | "currency" | "payment_method" | "refunds">>(
      `/orders/${orderId}`,
      { query: { _fields: "id,number,status,total,currency,payment_method,refunds" } }
    );
    return {
      id: o.id,
      number: String(o.number || o.id),
      status: o.status,
      totalMinor: toMinor(o.total),
      refundedMinor: (o.refunds ?? []).reduce((sum, r) => sum + Math.abs(toMinor(r.total)), 0),
      currency: o.currency || "USD",
      paymentMethodId: o.payment_method ?? "",
    };
  } catch (err) {
    if (err instanceof WooError && (err.kind === "not_found" || err.code === "woocommerce_rest_shop_order_invalid_id")) {
      return null;
    }
    throw err;
  }
}

export async function getOrderNotes(orderId: number): Promise<OrderNoteView[]> {
  const [notes, index] = await Promise.all([
    woo<WooOrderNote[]>(`/orders/${orderId}/notes`),
    getCatalogIndex(),
  ]);
  return notes.map((note) => ({
    id: note.id,
    author: note.author || "WooCommerce",
    createdAt: gmtIso(note.date_created_gmt),
    body: index.code(stripHtml(note.note ?? "")),
    kind: note.customer_note ? "customer" : note.added_by_user ? "private" : "system",
  }));
}

export async function getOrderRefunds(orderId: number): Promise<RefundView[]> {
  const refunds = await woo<WooRefund[]>(`/orders/${orderId}/refunds`, {
    query: { _fields: "id,date_created_gmt,amount,reason,refunded_by,refunded_payment" },
  });
  const index = await getCatalogIndex();
  return refunds.map((r) => ({
    id: r.id,
    createdAt: gmtIso(r.date_created_gmt),
    amountMinor: Math.abs(toMinor(r.amount)),
    reason: index.code(stripHtml(r.reason ?? "")),
    refundedPayment: Boolean(r.refunded_payment),
  }));
}

/** Whether the order's payment gateway can refund automatically. */
export async function gatewaySupportsRefunds(gatewayId: string): Promise<boolean> {
  if (!gatewayId) return false;
  try {
    const { value } = await memo(
      `gateway:${gatewayId}`,
      { ttlMs: 60 * 60 * 1000, tags: ["gateways"] },
      () =>
        woo<WooPaymentGateway>(`/payment_gateways/${encodeURIComponent(gatewayId)}`, {
          query: { _fields: "id,title,method_title,method_supports" },
        })
    );
    return Array.isArray(value.method_supports) && value.method_supports.includes("refunds");
  } catch {
    return false;
  }
}

export async function getStoreCurrency(): Promise<string> {
  try {
    const { value } = await memo("store-currency", { ttlMs: 6 * 60 * 60 * 1000, tags: ["settings"] }, () =>
      woo<WooCurrency>("/data/currencies/current")
    );
    return value.code || "USD";
  } catch {
    return "USD";
  }
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export async function updateOrderStatus(orderId: number, status: string): Promise<void> {
  await woo(`/orders/${orderId}`, {
    method: "PUT",
    body: { status, manual_update: true },
    query: { _fields: "id,status" },
  });
  invalidateOrders();
}

export async function updateOrdersStatus(
  orderIds: number[],
  status: string
): Promise<{ updated: number[]; failed: { id: number; message: string }[] }> {
  const updated: number[] = [];
  const failed: { id: number; message: string }[] = [];
  for (let i = 0; i < orderIds.length; i += 100) {
    const chunk = orderIds.slice(i, i + 100);
    const res = await woo<{ update?: { id: number; error?: { message?: string } }[] }>("/orders/batch", {
      method: "POST",
      body: { update: chunk.map((id) => ({ id, status, manual_update: true })) },
      timeoutMs: 60_000,
    });
    for (const entry of res.update ?? []) {
      if (entry.error) failed.push({ id: entry.id, message: entry.error.message ?? "Update failed" });
      else updated.push(entry.id);
    }
  }
  invalidateOrders();
  return { updated, failed };
}

export async function addOrderNote(orderId: number, note: string, toCustomer: boolean): Promise<void> {
  await woo(`/orders/${orderId}/notes`, {
    method: "POST",
    body: { note, customer_note: toCustomer, added_by_user: true },
    query: { _fields: "id" },
  });
}

export async function deleteOrderNote(orderId: number, noteId: number): Promise<void> {
  await woo(`/orders/${orderId}/notes/${noteId}`, {
    method: "DELETE",
    query: { force: true, _fields: "id" },
  });
}

export type EditableAddress = Omit<AddressView, "lines">;

export async function updateOrderAddress(
  orderId: number,
  kind: "billing" | "shipping",
  address: EditableAddress
): Promise<void> {
  const payload: Record<string, string> = {
    first_name: address.firstName,
    last_name: address.lastName,
    company: address.company,
    address_1: address.address1,
    address_2: address.address2,
    city: address.city,
    state: address.state,
    postcode: address.postcode,
    country: address.country,
    phone: address.phone,
  };
  if (kind === "billing") payload.email = address.email;
  await woo(`/orders/${orderId}`, {
    method: "PUT",
    body: { [kind]: payload },
    query: { _fields: "id" },
  });
  invalidateOrders();
}

export async function createRefund(
  orderId: number,
  input: { amount: string; reason: string; viaGateway: boolean }
): Promise<void> {
  await woo(`/orders/${orderId}/refunds`, {
    method: "POST",
    body: {
      amount: input.amount,
      reason: input.reason,
      api_refund: input.viaGateway,
      api_restock: false,
    },
    query: { _fields: "id" },
    timeoutMs: 45_000,
  });
  invalidateOrders();
}

/** Email the customer their order details (WooCommerce 9.8+). */
export async function sendOrderDetails(orderId: number): Promise<void> {
  await woo(`/orders/${orderId}/actions/send_order_details`, { method: "POST", body: {} });
}
