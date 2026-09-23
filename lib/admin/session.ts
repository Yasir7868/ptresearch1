/**
 * lib/admin/session.ts — SERVER-ONLY. Database-backed sessions.
 *
 * The browser holds a random 256-bit token in an httpOnly, SameSite=Lax
 * cookie (`__Host-` prefixed and Secure in production). The database stores
 * only the token's SHA-256, so every request is checked against the current
 * account state: disabling someone, removing them or resetting their password
 * signs them out everywhere immediately.
 *
 * Lifetime: 30 days absolute, ended early after 7 days without activity.
 * `last_seen_at` is written at most every 5 minutes.
 *
 * Cookies can only be set in Server Actions and Route Handlers (Next 16), so
 * startSession/endSession are only called from there.
 */

import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { db } from "./db";
import { IS_PRODUCTION } from "./config";
import { createToken, hashToken } from "./password";
import { isRole, type Role } from "./permissions";

/** Mirrored in proxy.ts (which can't import server modules). */
export const SESSION_COOKIE = IS_PRODUCTION ? "__Host-pt_admin" : "pt_admin";

const ABSOLUTE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const IDLE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const TOUCH_EVERY_MS = 5 * 60 * 1000;

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  sessionId: string;
}

export interface SessionInfo {
  key: string;
  createdAt: number;
  lastSeenAt: number;
  ip: string | null;
  userAgent: string | null;
  current: boolean;
}

/**
 * Client IP for rate limits and the activity log. The leftmost
 * X-Forwarded-For entry is whatever the client sent, so it is never used:
 * X-Real-IP (set by the hosting proxy) wins, then the entry the nearest proxy
 * appended (rightmost).
 */
export async function requestMeta(): Promise<{ ip: string | null; userAgent: string | null }> {
  try {
    const h = await headers();
    const appended = h.get("x-forwarded-for")?.split(",").map((part) => part.trim()).filter(Boolean).at(-1);
    return {
      ip: (h.get("x-real-ip")?.trim() || appended || null)?.slice(0, 64) ?? null,
      userAgent: h.get("user-agent")?.slice(0, 300) ?? null,
    };
  } catch {
    return { ip: null, userAgent: null };
  }
}

export async function startSession(userId: string): Promise<void> {
  const token = createToken();
  const now = Date.now();
  const { ip, userAgent } = await requestMeta();

  const conn = db();
  // Housekeeping: expired and idle sessions go on every sign-in.
  conn
    .prepare("DELETE FROM sessions WHERE expires_at <= ? OR last_seen_at <= ?")
    .run(now, now - IDLE_TTL_MS);
  conn
    .prepare(
      `INSERT INTO sessions (id, user_id, created_at, expires_at, last_seen_at, ip, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(hashToken(token), userId, now, now + ABSOLUTE_TTL_MS, now, ip, userAgent);

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax",
    path: "/",
    maxAge: ABSOLUTE_TTL_MS / 1000,
  });
}

/**
 * The signed-in person for this request, or null. Memoized per render pass,
 * so layouts, pages and components can all ask without extra queries.
 */
export const readSession = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 200) return null;

  const id = hashToken(token);
  const row = db()
    .prepare(
      `SELECT s.id AS session_id, s.expires_at, s.last_seen_at,
              u.id, u.email, u.name, u.role, u.status
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.id = ?`
    )
    .get(id) as
    | {
        session_id: string;
        expires_at: number;
        last_seen_at: number;
        id: string;
        email: string;
        name: string;
        role: string;
        status: string;
      }
    | undefined;
  if (!row) return null;

  const now = Date.now();
  if (row.expires_at <= now || row.last_seen_at <= now - IDLE_TTL_MS || row.status !== "active") {
    db().prepare("DELETE FROM sessions WHERE id = ?").run(id);
    return null;
  }
  if (!isRole(row.role)) return null;

  if (now - row.last_seen_at > TOUCH_EVERY_MS) {
    db().prepare("UPDATE sessions SET last_seen_at = ? WHERE id = ?").run(now, id);
  }

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    sessionId: row.session_id,
  };
});

export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    db().prepare("DELETE FROM sessions WHERE id = ?").run(hashToken(token));
  }
  // Expire it with the same attributes it was set with: browsers ignore a
  // __Host- cookie update that lacks Secure, and cookies().delete() omits it.
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function listSessions(userId: string, currentSessionId: string): SessionInfo[] {
  const now = Date.now();
  const rows = db()
    .prepare(
      `SELECT id, created_at, last_seen_at, ip, user_agent FROM sessions
       WHERE user_id = ? AND expires_at > ? AND last_seen_at > ?
       ORDER BY last_seen_at DESC`
    )
    .all(userId, now, now - IDLE_TTL_MS) as unknown as {
    id: string;
    created_at: number;
    last_seen_at: number;
    ip: string | null;
    user_agent: string | null;
  }[];
  // The row id is the token hash; the list shown in the browser gets an opaque key instead.
  return rows.map((r, index) => ({
    key: `${r.created_at}-${index}`,
    createdAt: r.created_at,
    lastSeenAt: r.last_seen_at,
    ip: r.ip,
    userAgent: r.user_agent,
    current: r.id === currentSessionId,
  }));
}

/** End every session for a person, optionally keeping one (the current). */
export function revokeSessions(userId: string, keepSessionId?: string): number {
  const result = keepSessionId
    ? db().prepare("DELETE FROM sessions WHERE user_id = ? AND id != ?").run(userId, keepSessionId)
    : db().prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
  return Number(result.changes);
}
