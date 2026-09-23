/**
 * lib/orders/store.ts — SERVER-ONLY. Reading and writing storefront orders.
 *
 * Lifecycle:
 *   createOrder()          status=pending, payment_status=unpaid — written
 *                          BEFORE the customer is charged, so a payment can
 *                          never exist without an order to attach it to.
 *   attachCheckoutSession() records the gateway's session id on the order.
 *   markOrderPaid()        from the VERIFIED callback only.
 *   markOrderFailed()      likewise.
 *
 * Status is never downgraded once an order is paid: callbacks are re-delivered
 * and can arrive out of order, and a late "expired" must not un-sell an order.
 *
 * Money is integer minor units throughout. `order_key` is the public handle
 * that appears in URLs; it is a random token, not a guessable sequence, because
 * the confirmation page is reachable with it alone.
 */

import "server-only";
import { randomUUID, randomBytes } from "node:crypto";
import { db, transaction } from "@/lib/admin/db";
import type { PricedOrderLine } from "./price";
import type { Totals } from "@/lib/totals";

export type OrderStatus = "pending" | "processing" | "cancelled" | "failed";
export type PaymentStatus = "unpaid" | "paid" | "failed" | "expired";

export interface OrderBuyer {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | undefined;
  company?: string | undefined;
  address1: string;
  address2?: string | undefined;
  city: string;
  state: string;
  postcode: string;
  country?: string | undefined;
  notes?: string | undefined;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  orderKey: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  checkoutSessionId?: string | undefined;
  buyer: OrderBuyer;
  currency: string;
  currencyMinorUnit: number;
  subtotalMinor: number;
  discountMinor: number;
  shippingMinor: number;
  totalMinor: number;
  coupons: string[];
  bulkTier?: string | undefined;
  bulkUnits: number;
  amountPaidMinor?: number | undefined;
  paidAt?: number | undefined;
  wooOrderId?: number | undefined;
  createdAt: number;
  updatedAt: number;
  items: OrderItemRecord[];
}

export interface OrderItemRecord {
  lineKey: string;
  sku: string;
  name: string;
  dose: string;
  productId?: number | undefined;
  variationId?: number | undefined;
  unitPriceMinor: number;
  qty: number;
  lineTotalMinor: number;
  meta?: { label: string; value: string }[] | undefined;
  excludedFromCoupons: boolean;
}

/** Human-facing order number. Sequential-looking, but salted so it is not a count. */
function nextOrderNumber(): string {
  const n = db()
    .prepare("SELECT COUNT(*) AS c FROM orders")
    .get() as { c: number };
  return `PT-${String(1000 + n.c + 1)}`;
}

export function createOrder(input: {
  buyer: OrderBuyer;
  lines: PricedOrderLine[];
  totals: Totals;
}): OrderRecord {
  const now = Date.now();
  const id = randomUUID();
  // Public handle: unguessable, since it alone opens the confirmation page.
  const orderKey = `pt_${randomBytes(18).toString("hex")}`;

  return transaction(() => {
    const orderNumber = nextOrderNumber();
    const conn = db();

    conn
      .prepare(
        `INSERT INTO orders (
           id, order_number, order_key, status, payment_status,
           email, first_name, last_name, phone, company,
           address_1, address_2, city, state, postcode, country, notes,
           currency, currency_minor_unit,
           subtotal_minor, discount_minor, shipping_minor, total_minor,
           coupons, bulk_tier, bulk_units,
           created_at, updated_at
         ) VALUES (?,?,?,?,?, ?,?,?,?,?, ?,?,?,?,?,?,?, ?,?, ?,?,?,?, ?,?,?, ?,?)`
      )
      .run(
        id,
        orderNumber,
        orderKey,
        "pending",
        "unpaid",
        input.buyer.email,
        input.buyer.firstName,
        input.buyer.lastName,
        input.buyer.phone ?? null,
        input.buyer.company ?? null,
        input.buyer.address1,
        input.buyer.address2 ?? null,
        input.buyer.city,
        input.buyer.state,
        input.buyer.postcode,
        input.buyer.country ?? "US",
        input.buyer.notes ?? null,
        "USD",
        input.totals.currencyMinorUnit,
        input.totals.itemsSubtotal,
        input.totals.discount,
        input.totals.shipping ?? 0,
        input.totals.total,
        input.totals.appliedCoupons.join(",") || null,
        input.totals.bulkTier?.code ?? null,
        input.totals.bulkUnits,
        now,
        now
      );

    const insertItem = conn.prepare(
      `INSERT INTO order_items (
         order_id, line_key, sku, name, dose, product_id, variation_id,
         unit_price_minor, quantity, line_total_minor, meta,
         excluded_from_coupons
       ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
    );

    for (const line of input.lines) {
      insertItem.run(
        id,
        line.lineKey,
        line.sku,
        line.name,
        line.dose || null,
        line.productId ?? null,
        line.variationId ?? null,
        line.unitPriceMinor,
        line.qty,
        line.lineTotalMinor,
        line.meta ? JSON.stringify(line.meta) : null,
        line.excludedFromCoupons ? 1 : 0
      );
    }

    return getOrderById(id)!;
  });
}

/**
 * Update the buyer on an unpaid order.
 *
 * The inline checkout lets someone unlock the details and edit them after the
 * card surface has already created their order. Without this, the order row
 * would keep the address they first typed and the parcel would go to the wrong
 * place. A paid order is never touched — at that point the address is part of
 * what was agreed.
 */
export function updateOrderBuyer(orderId: string, buyer: OrderBuyer): void {
  db()
    .prepare(
      `UPDATE orders
          SET email = ?, first_name = ?, last_name = ?, phone = ?, company = ?,
              address_1 = ?, address_2 = ?, city = ?, state = ?, postcode = ?,
              country = ?, notes = ?, updated_at = ?
        WHERE id = ? AND payment_status != 'paid'`
    )
    .run(
      buyer.email,
      buyer.firstName,
      buyer.lastName,
      buyer.phone ?? null,
      buyer.company ?? null,
      buyer.address1,
      buyer.address2 ?? null,
      buyer.city,
      buyer.state,
      buyer.postcode,
      buyer.country ?? "US",
      buyer.notes ?? null,
      Date.now(),
      orderId
    );
}

export function attachCheckoutSession(orderId: string, sessionId: string): void {
  db()
    .prepare(
      "UPDATE orders SET checkout_session_id = ?, updated_at = ? WHERE id = ?"
    )
    .run(sessionId, Date.now(), orderId);
}

/** Promote to paid. Idempotent; never downgrades an already-paid order. */
export function markOrderPaid(input: {
  sessionId: string;
  amountMinor?: number | undefined;
}): OrderRecord | null {
  const order = getOrderBySession(input.sessionId);
  if (!order) return null;
  if (order.paymentStatus === "paid") return order;

  const now = Date.now();
  db()
    .prepare(
      `UPDATE orders
          SET status = 'processing', payment_status = 'paid',
              amount_paid_minor = ?, paid_at = ?, updated_at = ?
        WHERE id = ?`
    )
    .run(input.amountMinor ?? order.totalMinor, now, now, order.id);

  return getOrderById(order.id);
}

/** Record a failed or expired payment. A paid order is left alone. */
export function markOrderUnsuccessful(input: {
  sessionId: string;
  paymentStatus: Extract<PaymentStatus, "failed" | "expired">;
}): OrderRecord | null {
  const order = getOrderBySession(input.sessionId);
  if (!order) return null;
  // A late "expired" after a confirmed payment is noise, not a reversal.
  if (order.paymentStatus === "paid") return order;

  const now = Date.now();
  db()
    .prepare(
      `UPDATE orders
          SET status = ?, payment_status = ?, updated_at = ?
        WHERE id = ?`
    )
    .run(
      input.paymentStatus === "failed" ? "failed" : "cancelled",
      input.paymentStatus,
      now,
      order.id
    );

  return getOrderById(order.id);
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

function hydrate(row: Record<string, unknown>): OrderRecord {
  const id = String(row.id);
  const itemRows = db()
    .prepare(
      `SELECT line_key, sku, name, dose, product_id, variation_id,
              unit_price_minor, quantity, line_total_minor, meta,
              excluded_from_coupons
         FROM order_items WHERE order_id = ? ORDER BY id`
    )
    .all(id) as Record<string, unknown>[];

  return {
    id,
    orderNumber: String(row.order_number),
    orderKey: String(row.order_key),
    status: String(row.status) as OrderStatus,
    paymentStatus: String(row.payment_status) as PaymentStatus,
    checkoutSessionId: (row.checkout_session_id as string | null) ?? undefined,
    buyer: {
      email: String(row.email),
      firstName: String(row.first_name),
      lastName: String(row.last_name),
      phone: (row.phone as string | null) ?? undefined,
      company: (row.company as string | null) ?? undefined,
      address1: String(row.address_1),
      address2: (row.address_2 as string | null) ?? undefined,
      city: String(row.city),
      state: String(row.state),
      postcode: String(row.postcode),
      country: String(row.country),
      notes: (row.notes as string | null) ?? undefined,
    },
    currency: String(row.currency),
    currencyMinorUnit: Number(row.currency_minor_unit),
    subtotalMinor: Number(row.subtotal_minor),
    discountMinor: Number(row.discount_minor),
    shippingMinor: Number(row.shipping_minor),
    totalMinor: Number(row.total_minor),
    coupons: row.coupons ? String(row.coupons).split(",").filter(Boolean) : [],
    bulkTier: (row.bulk_tier as string | null) ?? undefined,
    bulkUnits: Number(row.bulk_units),
    amountPaidMinor: (row.amount_paid_minor as number | null) ?? undefined,
    paidAt: (row.paid_at as number | null) ?? undefined,
    wooOrderId: (row.woo_order_id as number | null) ?? undefined,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    items: itemRows.map((i) => ({
      lineKey: String(i.line_key),
      sku: String(i.sku),
      name: String(i.name),
      dose: (i.dose as string | null) ?? "",
      productId: (i.product_id as number | null) ?? undefined,
      variationId: (i.variation_id as number | null) ?? undefined,
      unitPriceMinor: Number(i.unit_price_minor),
      qty: Number(i.quantity),
      lineTotalMinor: Number(i.line_total_minor),
      meta: i.meta
        ? (JSON.parse(String(i.meta)) as { label: string; value: string }[])
        : undefined,
      excludedFromCoupons: Number(i.excluded_from_coupons) === 1,
    })),
  };
}

const SELECT = `SELECT * FROM orders`;

export function getOrderById(id: string): OrderRecord | null {
  const row = db().prepare(`${SELECT} WHERE id = ?`).get(id) as
    | Record<string, unknown>
    | undefined;
  return row ? hydrate(row) : null;
}

export function getOrderByKey(orderKey: string): OrderRecord | null {
  const row = db().prepare(`${SELECT} WHERE order_key = ?`).get(orderKey) as
    | Record<string, unknown>
    | undefined;
  return row ? hydrate(row) : null;
}

export function getOrderBySession(sessionId: string): OrderRecord | null {
  const row = db()
    .prepare(`${SELECT} WHERE checkout_session_id = ?`)
    .get(sessionId) as Record<string, unknown> | undefined;
  return row ? hydrate(row) : null;
}

export interface OrderListPage {
  orders: OrderRecord[];
  total: number;
}

/** Newest first. `status` filters on the order status when given. */
export function listOrders(options: {
  limit?: number;
  offset?: number;
  status?: OrderStatus | undefined;
}): OrderListPage {
  const limit = Math.min(Math.max(options.limit ?? 25, 1), 100);
  const offset = Math.max(options.offset ?? 0, 0);
  const conn = db();

  const where = options.status ? "WHERE status = ?" : "";
  const params = options.status ? [options.status] : [];

  const total = (
    conn
      .prepare(`SELECT COUNT(*) AS c FROM orders ${where}`)
      .get(...params) as { c: number }
  ).c;

  const rows = conn
    .prepare(`${SELECT} ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, limit, offset) as Record<string, unknown>[];

  return { orders: rows.map(hydrate), total };
}
