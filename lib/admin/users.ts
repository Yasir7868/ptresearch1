/**
 * lib/admin/users.ts — SERVER-ONLY. Staff accounts: the first owner, invites,
 * password resets, roles, disabling and removing people.
 *
 * There is no email service in this stack, so invite and reset links are
 * returned to the owner who created them to pass on (copy button in Team).
 * Links are single-use, expire (invite 72h, reset 24h) and only their hash is
 * stored.
 *
 * Rules that protect access to the store:
 *   - There is always at least one active owner (can't demote, disable or
 *     remove the last one).
 *   - Nobody changes their own role, disables or removes themselves — another
 *     owner has to, so a slip of the mouse can't lock the business out.
 *   - 5 wrong passwords lock an account for 15 minutes.
 *   - Disabling someone or resetting their password ends all their sessions.
 */

import "server-only";
import { randomUUID } from "node:crypto";
import { db, transaction } from "./db";
import { isRole, type Role } from "./permissions";
import {
  createToken,
  hashPassword,
  hashToken,
  needsRehash,
  verifyAgainstDummy,
  verifyPassword,
} from "./password";

export type UserStatus = "invited" | "active" | "disabled";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: UserStatus;
  lastLoginAt: number | null;
  createdAt: number;
}

export interface TeamMember extends AdminUser {
  /** When the latest unused invite link expires (invited people only). */
  inviteExpiresAt: number | null;
}

/** A rule was broken; the message is safe to show the person. */
export class UserRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserRuleError";
  }
}

const INVITE_TTL_MS = 72 * 60 * 60 * 1000;
const RESET_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  password_hash: string | null;
  failed_logins: number;
  locked_until: number | null;
  last_login_at: number | null;
  created_at: number;
}

const USER_COLUMNS =
  "id, email, name, role, status, password_hash, failed_logins, locked_until, last_login_at, created_at";

function toUser(row: UserRow): AdminUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: isRole(row.role) ? row.role : "viewer",
    status: row.status as UserStatus,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
  };
}

function rowById(id: string): UserRow | undefined {
  return db().prepare(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`).get(id) as
    | UserRow
    | undefined;
}

function rowByEmail(email: string): UserRow | undefined {
  return db()
    .prepare(`SELECT ${USER_COLUMNS} FROM users WHERE email = ?`)
    .get(email.trim().toLowerCase()) as UserRow | undefined;
}

function requireRow(id: string): UserRow {
  const row = rowById(id);
  if (!row) throw new UserRuleError("That person no longer has an account.");
  return row;
}

function activeOwnerCount(): number {
  const row = db()
    .prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'owner' AND status = 'active'")
    .get() as { n: number };
  return row.n;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export function countUsers(): number {
  const row = db().prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number };
  return row.n;
}

export function getUser(id: string): AdminUser | null {
  const row = rowById(id);
  return row ? toUser(row) : null;
}

const ROLE_ORDER = "CASE role WHEN 'owner' THEN 0 WHEN 'manager' THEN 1 WHEN 'fulfillment' THEN 2 ELSE 3 END";
const STATUS_ORDER = "CASE status WHEN 'active' THEN 0 WHEN 'invited' THEN 1 ELSE 2 END";

export function listTeam(): TeamMember[] {
  const now = Date.now();
  const rows = db()
    .prepare(
      `SELECT ${USER_COLUMNS},
         (SELECT MAX(expires_at) FROM user_tokens t
            WHERE t.user_id = users.id AND t.purpose = 'invite'
              AND t.used_at IS NULL AND t.expires_at > ?) AS invite_expires_at
       FROM users
       ORDER BY ${STATUS_ORDER}, ${ROLE_ORDER}, name COLLATE NOCASE`
    )
    .all(now) as unknown as (UserRow & { invite_expires_at: number | null })[];
  return rows.map((row) => ({ ...toUser(row), inviteExpiresAt: row.invite_expires_at }));
}

/** Active owners' names — shown to people who need access to something. */
export function ownerNames(): string[] {
  const rows = db()
    .prepare("SELECT name FROM users WHERE role = 'owner' AND status = 'active' ORDER BY name")
    .all() as unknown as { name: string }[];
  return rows.map((r) => r.name);
}

// ---------------------------------------------------------------------------
// First owner
// ---------------------------------------------------------------------------

export async function createFirstOwner(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AdminUser> {
  const passwordHash = await hashPassword(input.password);
  return transaction(() => {
    if (countUsers() > 0) {
      throw new UserRuleError("Setup is already complete. Sign in instead.");
    }
    const now = Date.now();
    const id = randomUUID();
    db()
      .prepare(
        `INSERT INTO users (id, email, name, role, status, password_hash, created_at, updated_at)
         VALUES (?, ?, ?, 'owner', 'active', ?, ?, ?)`
      )
      .run(id, input.email.trim().toLowerCase(), input.name.trim(), passwordHash, now, now);
    return toUser(rowById(id)!);
  });
}

// ---------------------------------------------------------------------------
// Invites and reset links
// ---------------------------------------------------------------------------

function issueToken(
  userId: string,
  purpose: "invite" | "reset",
  ttlMs: number,
  actorId: string | null
): { token: string; expiresAt: number } {
  const now = Date.now();
  // Only the newest link of each kind works.
  db()
    .prepare(
      "UPDATE user_tokens SET used_at = ? WHERE user_id = ? AND purpose = ? AND used_at IS NULL"
    )
    .run(now, userId, purpose);
  const token = createToken();
  const expiresAt = now + ttlMs;
  db()
    .prepare(
      `INSERT INTO user_tokens (id, user_id, purpose, created_at, expires_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(hashToken(token), userId, purpose, now, expiresAt, actorId);
  return { token, expiresAt };
}

export function inviteUser(
  input: { name: string; email: string; role: Role },
  actorId: string
): { user: AdminUser; token: string; expiresAt: number } {
  return transaction(() => {
    const email = input.email.trim().toLowerCase();
    const existing = rowByEmail(email);
    const now = Date.now();
    let id: string;

    if (existing) {
      if (existing.status !== "invited") {
        throw new UserRuleError(
          existing.status === "disabled"
            ? "That person already has an account, which is disabled. Enable it from the Team list instead."
            : "That person already has access."
        );
      }
      id = existing.id;
      db()
        .prepare("UPDATE users SET name = ?, role = ?, updated_at = ? WHERE id = ?")
        .run(input.name.trim(), input.role, now, id);
    } else {
      id = randomUUID();
      db()
        .prepare(
          `INSERT INTO users (id, email, name, role, status, created_at, updated_at, created_by)
           VALUES (?, ?, ?, ?, 'invited', ?, ?, ?)`
        )
        .run(id, email, input.name.trim(), input.role, now, now, actorId);
    }

    const { token, expiresAt } = issueToken(id, "invite", INVITE_TTL_MS, actorId);
    return { user: toUser(rowById(id)!), token, expiresAt };
  });
}

export function reissueInvite(userId: string, actorId: string): { token: string; expiresAt: number } {
  return transaction(() => {
    const row = requireRow(userId);
    if (row.status !== "invited") {
      throw new UserRuleError("This person has already accepted their invite.");
    }
    return issueToken(userId, "invite", INVITE_TTL_MS, actorId);
  });
}

export function createResetLink(
  userId: string,
  actorId: string
): { token: string; expiresAt: number; user: AdminUser } {
  return transaction(() => {
    const row = requireRow(userId);
    if (row.status !== "active") {
      throw new UserRuleError("Reset links can only be created for active accounts.");
    }
    return { ...issueToken(userId, "reset", RESET_TTL_MS, actorId), user: toUser(row) };
  });
}

/** Look at a link without using it (to render the invite/reset page). */
export function peekToken(
  token: string,
  purpose: "invite" | "reset"
): { user: AdminUser; expiresAt: number } | null {
  if (!token || token.length > 200) return null;
  const row = db()
    .prepare(
      `SELECT t.expires_at, u.id AS user_id FROM user_tokens t JOIN users u ON u.id = t.user_id
       WHERE t.id = ? AND t.purpose = ? AND t.used_at IS NULL AND t.expires_at > ?`
    )
    .get(hashToken(token), purpose, Date.now()) as
    | { expires_at: number; user_id: string }
    | undefined;
  if (!row) return null;
  const user = rowById(row.user_id);
  if (!user) return null;
  const expectedStatus = purpose === "invite" ? "invited" : "active";
  if (user.status !== expectedStatus) return null;
  return { user: toUser(user), expiresAt: row.expires_at };
}

/** Atomically mark a link used; returns the user it belongs to, or null. */
function consumeToken(token: string, purpose: "invite" | "reset"): UserRow | null {
  const hashed = hashToken(token);
  const now = Date.now();
  const row = db()
    .prepare(
      "SELECT user_id FROM user_tokens WHERE id = ? AND purpose = ? AND used_at IS NULL AND expires_at > ?"
    )
    .get(hashed, purpose, now) as { user_id: string } | undefined;
  if (!row) return null;
  const result = db()
    .prepare("UPDATE user_tokens SET used_at = ? WHERE id = ? AND used_at IS NULL")
    .run(now, hashed);
  if (Number(result.changes) !== 1) return null;
  return rowById(row.user_id) ?? null;
}

export async function acceptInvite(
  token: string,
  input: { name: string; password: string }
): Promise<AdminUser> {
  const passwordHash = await hashPassword(input.password);
  return transaction(() => {
    const row = consumeToken(token, "invite");
    if (!row || row.status !== "invited") {
      throw new UserRuleError("This invite link has expired or was already used. Ask an owner for a new one.");
    }
    const now = Date.now();
    db()
      .prepare(
        `UPDATE users SET name = ?, password_hash = ?, status = 'active', failed_logins = 0,
           locked_until = NULL, last_login_at = ?, updated_at = ? WHERE id = ?`
      )
      .run(input.name.trim(), passwordHash, now, now, row.id);
    return toUser(rowById(row.id)!);
  });
}

export async function completePasswordReset(token: string, password: string): Promise<AdminUser> {
  const passwordHash = await hashPassword(password);
  return transaction(() => {
    const row = consumeToken(token, "reset");
    if (!row || row.status !== "active") {
      throw new UserRuleError("This reset link has expired or was already used. Ask an owner for a new one.");
    }
    const now = Date.now();
    db()
      .prepare(
        `UPDATE users SET password_hash = ?, failed_logins = 0, locked_until = NULL,
           last_login_at = ?, updated_at = ? WHERE id = ?`
      )
      .run(passwordHash, now, now, row.id);
    db().prepare("DELETE FROM sessions WHERE user_id = ?").run(row.id);
    return toUser(rowById(row.id)!);
  });
}

// ---------------------------------------------------------------------------
// Sign-in
// ---------------------------------------------------------------------------

export type LoginResult =
  | { ok: true; user: AdminUser }
  | { ok: false; reason: "invalid" }
  | { ok: false; reason: "locked"; retryAt: number };

export async function verifyLogin(email: string, password: string): Promise<LoginResult> {
  const row = rowByEmail(email);
  const now = Date.now();

  if (!row || row.status !== "active" || !row.password_hash) {
    await verifyAgainstDummy(password);
    return { ok: false, reason: "invalid" };
  }
  if (row.locked_until && row.locked_until > now) {
    // Same scrypt cost as every other path, so timing doesn't single out locked accounts.
    await verifyAgainstDummy(password);
    return { ok: false, reason: "locked", retryAt: row.locked_until };
  }

  const valid = await verifyPassword(password, row.password_hash);
  if (!valid) {
    const failures = row.failed_logins + 1;
    if (failures >= MAX_FAILED_LOGINS) {
      const retryAt = now + LOCKOUT_MS;
      db()
        .prepare("UPDATE users SET failed_logins = 0, locked_until = ? WHERE id = ?")
        .run(retryAt, row.id);
      return { ok: false, reason: "locked", retryAt };
    }
    db().prepare("UPDATE users SET failed_logins = ? WHERE id = ?").run(failures, row.id);
    return { ok: false, reason: "invalid" };
  }

  const rehash = needsRehash(row.password_hash) ? await hashPassword(password) : null;
  db()
    .prepare(
      `UPDATE users SET failed_logins = 0, locked_until = NULL, last_login_at = ?,
         password_hash = COALESCE(?, password_hash) WHERE id = ?`
    )
    .run(now, rehash, row.id);
  return { ok: true, user: toUser(rowById(row.id)!) };
}

// ---------------------------------------------------------------------------
// Self-service
// ---------------------------------------------------------------------------

export function updateName(userId: string, name: string): void {
  db()
    .prepare("UPDATE users SET name = ?, updated_at = ? WHERE id = ?")
    .run(name.trim(), Date.now(), userId);
}

/** Change your own password. Other sessions end; the current one stays. */
export async function changePassword(
  userId: string,
  currentPassword: string,
  nextPassword: string,
  keepSessionId: string
): Promise<void> {
  const row = requireRow(userId);
  if (!row.password_hash || !(await verifyPassword(currentPassword, row.password_hash))) {
    throw new UserRuleError("Your current password is incorrect.");
  }
  const passwordHash = await hashPassword(nextPassword);
  transaction(() => {
    db()
      .prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?")
      .run(passwordHash, Date.now(), userId);
    db().prepare("DELETE FROM sessions WHERE user_id = ? AND id != ?").run(userId, keepSessionId);
  });
}

// ---------------------------------------------------------------------------
// Managing other people
// ---------------------------------------------------------------------------

export function changeRole(targetId: string, role: Role, actorId: string): { before: Role; user: AdminUser } {
  return transaction(() => {
    if (targetId === actorId) {
      throw new UserRuleError("You can't change your own role. Ask another owner.");
    }
    const row = requireRow(targetId);
    const before = toUser(row).role;
    if (before === role) return { before, user: toUser(row) };
    if (before === "owner" && row.status === "active" && activeOwnerCount() <= 1) {
      throw new UserRuleError("There must always be at least one owner.");
    }
    db()
      .prepare("UPDATE users SET role = ?, updated_at = ? WHERE id = ?")
      .run(role, Date.now(), targetId);
    return { before, user: toUser(rowById(targetId)!) };
  });
}

export function setDisabled(targetId: string, disabled: boolean, actorId: string): AdminUser {
  return transaction(() => {
    if (targetId === actorId) {
      throw new UserRuleError("You can't disable your own account.");
    }
    const row = requireRow(targetId);
    const now = Date.now();

    if (disabled) {
      if (row.status === "disabled") return toUser(row);
      if (row.role === "owner" && row.status === "active" && activeOwnerCount() <= 1) {
        throw new UserRuleError("There must always be at least one active owner.");
      }
      db().prepare("UPDATE users SET status = 'disabled', updated_at = ? WHERE id = ?").run(now, targetId);
      db().prepare("DELETE FROM sessions WHERE user_id = ?").run(targetId);
      db()
        .prepare("UPDATE user_tokens SET used_at = ? WHERE user_id = ? AND used_at IS NULL")
        .run(now, targetId);
    } else {
      if (row.status !== "disabled") return toUser(row);
      // People who never accepted their invite go back to "invited".
      const status = row.password_hash ? "active" : "invited";
      db()
        .prepare(
          "UPDATE users SET status = ?, failed_logins = 0, locked_until = NULL, updated_at = ? WHERE id = ?"
        )
        .run(status, now, targetId);
    }
    return toUser(rowById(targetId)!);
  });
}

export function removeUser(targetId: string, actorId: string): AdminUser {
  return transaction(() => {
    if (targetId === actorId) {
      throw new UserRuleError("You can't remove your own account.");
    }
    const row = requireRow(targetId);
    if (row.role === "owner" && row.status === "active" && activeOwnerCount() <= 1) {
      throw new UserRuleError("There must always be at least one active owner.");
    }
    db().prepare("DELETE FROM users WHERE id = ?").run(targetId);
    return toUser(row);
  });
}
