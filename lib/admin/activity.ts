/**
 * lib/admin/activity.ts — SERVER-ONLY. The activity log: who did what, when.
 *
 * Every change made through the admin panel is recorded here with the
 * person's name as it was at the time (entries survive the account being
 * removed). Order changes are ALSO written to the WooCommerce order notes, so
 * they are visible in WP admin and the WooCommerce mobile app.
 */

import "server-only";
import { db } from "./db";
import { requestMeta } from "./session";

export type ActivityTargetType = "order" | "product" | "user" | "store" | "account";

export interface ActivityEntry {
  id: number;
  createdAt: number;
  userId: string | null;
  userName: string | null;
  action: string;
  targetType: ActivityTargetType | null;
  targetId: string | null;
  summary: string;
  ip: string | null;
}

const RETENTION_MS = 400 * 24 * 60 * 60 * 1000;

export async function recordActivity(input: {
  actor: { id: string; name: string } | null;
  action: string;
  target?: { type: ActivityTargetType; id: string | number };
  summary: string;
}): Promise<void> {
  const { ip } = await requestMeta();
  const now = Date.now();
  try {
    const conn = db();
    conn
      .prepare(
        `INSERT INTO activity (created_at, user_id, user_name, action, target_type, target_id, summary, ip)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        now,
        input.actor?.id ?? null,
        input.actor?.name ?? null,
        input.action,
        input.target?.type ?? null,
        input.target ? String(input.target.id) : null,
        input.summary.slice(0, 500),
        ip
      );
    // Cheap retention sweep on roughly 1 in 200 writes.
    if (Math.random() < 0.005) {
      conn.prepare("DELETE FROM activity WHERE created_at < ?").run(now - RETENTION_MS);
    }
  } catch (err) {
    // The log must never block the change it describes.
    console.error("[admin] failed to record activity", err);
  }
}

export interface ActivityFilter {
  userId?: string;
  targetType?: ActivityTargetType;
  targetId?: string;
  page?: number;
  perPage?: number;
}

export function listActivity(filter: ActivityFilter = {}): {
  entries: ActivityEntry[];
  total: number;
} {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (filter.userId) {
    where.push("user_id = ?");
    params.push(filter.userId);
  }
  if (filter.targetType) {
    where.push("target_type = ?");
    params.push(filter.targetType);
  }
  if (filter.targetId) {
    where.push("target_id = ?");
    params.push(filter.targetId);
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const perPage = Math.min(Math.max(filter.perPage ?? 50, 1), 200);
  const page = Math.max(filter.page ?? 1, 1);

  const conn = db();
  const total = (
    conn.prepare(`SELECT COUNT(*) AS n FROM activity ${clause}`).get(...params) as { n: number }
  ).n;
  const rows = conn
    .prepare(
      `SELECT id, created_at, user_id, user_name, action, target_type, target_id, summary, ip
       FROM activity ${clause} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`
    )
    .all(...params, perPage, (page - 1) * perPage) as unknown as {
    id: number;
    created_at: number;
    user_id: string | null;
    user_name: string | null;
    action: string;
    target_type: ActivityTargetType | null;
    target_id: string | null;
    summary: string;
    ip: string | null;
  }[];

  return {
    total,
    entries: rows.map((r) => ({
      id: r.id,
      createdAt: r.created_at,
      userId: r.user_id,
      userName: r.user_name,
      action: r.action,
      targetType: r.target_type,
      targetId: r.target_id,
      summary: r.summary,
      ip: r.ip,
    })),
  };
}

/** People who appear in the log (for the filter), newest activity first. */
export function activityPeople(): { id: string; name: string }[] {
  const rows = db()
    .prepare(
      `SELECT user_id, user_name FROM activity WHERE user_id IS NOT NULL
       GROUP BY user_id ORDER BY MAX(created_at) DESC LIMIT 100`
    )
    .all() as unknown as { user_id: string; user_name: string | null }[];
  return rows.map((r) => ({ id: r.user_id, name: r.user_name ?? "Unknown" }));
}
