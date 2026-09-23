/**
 * lib/admin/payments.ts — SERVER-ONLY. Durable record of gateway payment
 * events.
 *
 * The SDK is explicit that callbacks are the source of truth for whether money
 * moved, so they cannot land in a log line and nowhere else. They are written
 * here, in the admin panel's SQLite, keyed by the gateway's session id.
 *
 * This is NOT an order store. WooCommerce stays the system of record for
 * orders (README); this table answers "did the processor tell us this checkout
 * was paid, and what did it say", which is what the confirmation page and a
 * staff member chasing a payment both need.
 *
 * Callbacks can arrive more than once and out of order, so writes are an
 * idempotent upsert on `session_id` and a later event never overwrites a
 * terminal `succeeded` with something weaker.
 */

import "server-only";
import { db } from "./db";

export interface PaymentEventInput {
  sessionId: string;
  checkoutId?: string | undefined;
  orderNumber?: string | undefined;
  event: string;
  status: string;
  amountMinor?: number | undefined;
  currency?: string | undefined;
  email?: string | undefined;
  raw: string;
}

export interface PaymentEventRecord extends Omit<PaymentEventInput, "raw"> {
  raw: string;
  createdAt: number;
  updatedAt: number;
}

/** Statuses that must not be downgraded by a later, weaker callback. */
const TERMINAL = new Set(["succeeded", "paid", "complete", "completed"]);

export function recordPaymentEvent(input: PaymentEventInput): void {
  const now = Date.now();
  const conn = db();

  const existing = conn
    .prepare("SELECT status FROM payment_events WHERE session_id = ?")
    .get(input.sessionId) as { status: string } | undefined;

  if (existing && TERMINAL.has(existing.status.toLowerCase())) {
    if (!TERMINAL.has(input.status.toLowerCase())) {
      // A late "expired" after a confirmed payment is noise, not a downgrade.
      return;
    }
  }

  conn
    .prepare(
      `INSERT INTO payment_events
         (session_id, checkout_id, order_number, event, status,
          amount_minor, currency, email, raw, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(session_id) DO UPDATE SET
         checkout_id  = COALESCE(excluded.checkout_id,  payment_events.checkout_id),
         order_number = COALESCE(excluded.order_number, payment_events.order_number),
         event        = excluded.event,
         status       = excluded.status,
         amount_minor = COALESCE(excluded.amount_minor, payment_events.amount_minor),
         currency     = COALESCE(excluded.currency,     payment_events.currency),
         email        = COALESCE(excluded.email,        payment_events.email),
         raw          = excluded.raw,
         updated_at   = excluded.updated_at`
    )
    .run(
      input.sessionId,
      input.checkoutId ?? null,
      input.orderNumber ?? null,
      input.event,
      input.status,
      input.amountMinor ?? null,
      input.currency ?? null,
      input.email ?? null,
      input.raw,
      now,
      now
    );
}

export function findPaymentBySession(sessionId: string): PaymentEventRecord | null {
  const row = db()
    .prepare(
      `SELECT session_id, checkout_id, order_number, event, status, amount_minor,
              currency, email, raw, created_at, updated_at
         FROM payment_events WHERE session_id = ?`
    )
    .get(sessionId) as Record<string, unknown> | undefined;

  if (!row) return null;

  return {
    sessionId: String(row.session_id),
    checkoutId: (row.checkout_id as string | null) ?? undefined,
    orderNumber: (row.order_number as string | null) ?? undefined,
    event: String(row.event),
    status: String(row.status),
    amountMinor: (row.amount_minor as number | null) ?? undefined,
    currency: (row.currency as string | null) ?? undefined,
    email: (row.email as string | null) ?? undefined,
    raw: String(row.raw),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}
