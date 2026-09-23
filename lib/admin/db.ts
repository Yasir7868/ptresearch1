/**
 * lib/admin/db.ts — SERVER-ONLY. The admin panel's own small database:
 * staff accounts, sessions, invite/reset links, the activity log and a little
 * operational state (last webhook seen). Orders, products and customers are
 * NOT stored here — WooCommerce stays the system of record for those.
 *
 * SQLite through Node's built-in `node:sqlite` (Node >= 22.13): no native
 * dependency to compile, one file to back up. The connection is opened lazily
 * on first use (never at import or build time) and cached on globalThis so
 * dev-server reloads don't open a new handle per edit.
 *
 * Schema changes are append-only entries in MIGRATIONS, tracked with
 * `PRAGMA user_version`. Never edit a migration that has shipped.
 */

import "server-only";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { dbLocation } from "./config";

const MIGRATIONS: readonly string[] = [
  // 1 — initial schema. Timestamps are epoch milliseconds.
  `
  CREATE TABLE users (
    id                TEXT PRIMARY KEY,
    email             TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name              TEXT NOT NULL,
    role              TEXT NOT NULL,
    status            TEXT NOT NULL DEFAULT 'active',
    password_hash     TEXT,
    failed_logins     INTEGER NOT NULL DEFAULT 0,
    locked_until      INTEGER,
    last_login_at     INTEGER,
    created_at        INTEGER NOT NULL,
    updated_at        INTEGER NOT NULL,
    created_by        TEXT
  );

  CREATE TABLE sessions (
    id                TEXT PRIMARY KEY,
    user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at        INTEGER NOT NULL,
    expires_at        INTEGER NOT NULL,
    last_seen_at      INTEGER NOT NULL,
    ip                TEXT,
    user_agent        TEXT
  );
  CREATE INDEX sessions_user_id ON sessions(user_id);

  CREATE TABLE user_tokens (
    id                TEXT PRIMARY KEY,
    user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purpose           TEXT NOT NULL,
    created_at        INTEGER NOT NULL,
    expires_at        INTEGER NOT NULL,
    used_at           INTEGER,
    created_by        TEXT
  );
  CREATE INDEX user_tokens_user_id ON user_tokens(user_id);

  CREATE TABLE activity (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at        INTEGER NOT NULL,
    user_id           TEXT,
    user_name         TEXT,
    action            TEXT NOT NULL,
    target_type       TEXT,
    target_id         TEXT,
    summary           TEXT NOT NULL,
    ip                TEXT
  );
  CREATE INDEX activity_created_at ON activity(created_at);
  CREATE INDEX activity_target ON activity(target_type, target_id);
  CREATE INDEX activity_user ON activity(user_id);

  CREATE TABLE kv (
    key               TEXT PRIMARY KEY,
    value             TEXT NOT NULL,
    updated_at        INTEGER NOT NULL
  );
  `,
  // 2 — payment gateway callbacks (lib/admin/payments.ts). One row per
  // Checkout Session; callbacks are re-delivered, so writes upsert on
  // session_id. `raw` keeps the verified body verbatim for disputes.
  `
  CREATE TABLE payment_events (
    session_id        TEXT PRIMARY KEY,
    checkout_id       TEXT,
    order_number      TEXT,
    event             TEXT NOT NULL,
    status            TEXT NOT NULL,
    amount_minor      INTEGER,
    currency          TEXT,
    email             TEXT,
    raw               TEXT NOT NULL,
    created_at        INTEGER NOT NULL,
    updated_at        INTEGER NOT NULL
  );
  CREATE INDEX payment_events_checkout ON payment_events (checkout_id);
  CREATE INDEX payment_events_created ON payment_events (created_at DESC);
  `,
  // 3 — storefront orders (lib/orders/). Every order taken through the
  // embedded payment gateway is written here BEFORE the customer is charged,
  // priced server-side, and updated by the signed callback.
  //
  // Money is integer minor units, matching lib/cart.tsx and the rest of the
  // app. `order_key` is the public handle used in URLs; `id` is internal.
  // WooCommerce remains the system of record for products and stock — this is
  // the record of what this storefront sold, and what the processor charged.
  `
  CREATE TABLE orders (
    id                TEXT PRIMARY KEY,
    order_number      TEXT NOT NULL UNIQUE,
    order_key         TEXT NOT NULL UNIQUE,
    status            TEXT NOT NULL DEFAULT 'pending',
    payment_status    TEXT NOT NULL DEFAULT 'unpaid',
    checkout_session_id TEXT UNIQUE,

    email             TEXT NOT NULL,
    first_name        TEXT NOT NULL,
    last_name         TEXT NOT NULL,
    phone             TEXT,
    company           TEXT,

    address_1         TEXT NOT NULL,
    address_2         TEXT,
    city              TEXT NOT NULL,
    state             TEXT NOT NULL,
    postcode          TEXT NOT NULL,
    country           TEXT NOT NULL DEFAULT 'US',
    notes             TEXT,

    currency          TEXT NOT NULL DEFAULT 'USD',
    currency_minor_unit INTEGER NOT NULL DEFAULT 2,
    subtotal_minor    INTEGER NOT NULL,
    discount_minor    INTEGER NOT NULL DEFAULT 0,
    shipping_minor    INTEGER NOT NULL DEFAULT 0,
    total_minor       INTEGER NOT NULL,
    coupons           TEXT,
    bulk_tier         TEXT,
    bulk_units        INTEGER NOT NULL DEFAULT 0,

    amount_paid_minor INTEGER,
    paid_at           INTEGER,
    woo_order_id      INTEGER,

    created_at        INTEGER NOT NULL,
    updated_at        INTEGER NOT NULL
  );
  CREATE INDEX orders_created ON orders (created_at DESC);
  CREATE INDEX orders_status ON orders (status);
  CREATE INDEX orders_email ON orders (email COLLATE NOCASE);

  CREATE TABLE order_items (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id          TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    line_key          TEXT NOT NULL,
    sku               TEXT NOT NULL,
    name              TEXT NOT NULL,
    dose              TEXT,
    product_id        INTEGER,
    variation_id      INTEGER,
    unit_price_minor  INTEGER NOT NULL,
    quantity          INTEGER NOT NULL,
    line_total_minor  INTEGER NOT NULL,
    meta              TEXT,
    excluded_from_coupons INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX order_items_order ON order_items (order_id);
  `,
];

const globalForDb = globalThis as typeof globalThis & {
  __ptAdminDb?: DatabaseSync;
};

/** The shared connection, opened and migrated on first use. */
export function db(): DatabaseSync {
  if (globalForDb.__ptAdminDb) return globalForDb.__ptAdminDb;

  const { path } = dbLocation();
  mkdirSync(dirname(path), { recursive: true });

  const conn = new DatabaseSync(path);
  conn.exec(`
    PRAGMA busy_timeout = 5000;
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA foreign_keys = ON;
  `);
  migrate(conn);

  globalForDb.__ptAdminDb = conn;
  return conn;
}

function migrate(conn: DatabaseSync): void {
  const row = conn.prepare("PRAGMA user_version").get() as { user_version: number };
  for (let version = row.user_version; version < MIGRATIONS.length; version++) {
    conn.exec("BEGIN IMMEDIATE");
    try {
      conn.exec(MIGRATIONS[version]!);
      conn.exec(`PRAGMA user_version = ${version + 1}`);
      conn.exec("COMMIT");
    } catch (err) {
      conn.exec("ROLLBACK");
      throw err;
    }
  }
}

/**
 * Run `work` inside a write transaction. `work` must be synchronous — do any
 * slow async work (password hashing, WooCommerce calls) before calling this.
 */
export function transaction<T>(work: () => T): T {
  const conn = db();
  conn.exec("BEGIN IMMEDIATE");
  try {
    const result = work();
    conn.exec("COMMIT");
    return result;
  } catch (err) {
    conn.exec("ROLLBACK");
    throw err;
  }
}

/** Small JSON key-value store for operational state. */
export function readKv<T>(key: string): { value: T; updatedAt: number } | null {
  const row = db()
    .prepare("SELECT value, updated_at FROM kv WHERE key = ?")
    .get(key) as { value: string; updated_at: number } | undefined;
  if (!row) return null;
  try {
    return { value: JSON.parse(row.value) as T, updatedAt: row.updated_at };
  } catch {
    return null;
  }
}

export function writeKv(key: string, value: unknown): void {
  db()
    .prepare(
      `INSERT INTO kv (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
    )
    .run(key, JSON.stringify(value), Date.now());
}
