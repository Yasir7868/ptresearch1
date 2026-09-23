/**
 * scripts/admin-user.mjs — admin panel account recovery from the server's
 * shell, for when nobody who can manage the team is able to sign in.
 *
 *   node scripts/admin-user.mjs list
 *   node scripts/admin-user.mjs reset-link <email>           24h password reset link (also unlocks)
 *   node scripts/admin-user.mjs make-owner <email>           give an existing person the Owner role
 *   node scripts/admin-user.mjs invite-owner <email> <name>  create an owner invite (72h link)
 *
 * Run it where the database lives (on Railway: `railway ssh`, then
 * `node scripts/admin-user.mjs …`). Uses the same ADMIN_DB_PATH /
 * RAILWAY_VOLUME_MOUNT_PATH resolution as the app. Links are printed with
 * NEXT_PUBLIC_SITE_URL (or --origin https://…) in front.
 *
 * Every change is written to the activity log as "Server console".
 */

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const HOUR = 60 * 60 * 1000;

// Same token scheme as lib/admin/password.ts: 32 random bytes handed out once,
// only the SHA-256 stored.
const createToken = () => randomBytes(32).toString("base64url");
const hashToken = (token) => createHash("sha256").update(token).digest("hex");

function fail(message) {
  console.error(`\n  ${message}\n`);
  process.exit(1);
}

function dbPath() {
  if (process.env.ADMIN_DB_PATH) return process.env.ADMIN_DB_PATH;
  if (process.env.RAILWAY_VOLUME_MOUNT_PATH) return join(process.env.RAILWAY_VOLUME_MOUNT_PATH, "admin.sqlite");
  return join(process.cwd(), ".data", "admin.sqlite");
}

const args = process.argv.slice(2);
const originFlag = args.indexOf("--origin");
const origin = (
  originFlag >= 0 ? args.splice(originFlag, 2)[1] : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
)?.replace(/\/+$/, "");
const [command, email, ...nameParts] = args;

const path = dbPath();
if (!existsSync(path)) fail(`No admin database at ${path}. Open the admin panel once (or set ADMIN_DB_PATH) first.`);

const db = new DatabaseSync(path);
db.exec("PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;");
const now = Date.now();

function findUser(address) {
  if (!address) fail("Give the person's email address.");
  const user = db.prepare("SELECT id, email, name, role, status FROM users WHERE email = ?").get(address.trim().toLowerCase());
  if (!user) fail(`No account for ${address}. Run "list" to see everyone.`);
  return user;
}

function log(action, targetId, summary) {
  db.prepare(
    `INSERT INTO activity (created_at, user_id, user_name, action, target_type, target_id, summary, ip)
     VALUES (?, NULL, 'Server console', ?, 'user', ?, ?, NULL)`
  ).run(now, action, targetId, summary);
}

function issue(userId, purpose, ttl) {
  db.prepare("UPDATE user_tokens SET used_at = ? WHERE user_id = ? AND purpose = ? AND used_at IS NULL").run(now, userId, purpose);
  const token = createToken();
  db.prepare(
    "INSERT INTO user_tokens (id, user_id, purpose, created_at, expires_at, created_by) VALUES (?, ?, ?, ?, ?, NULL)"
  ).run(hashToken(token), userId, purpose, now, now + ttl);
  return token;
}

switch (command) {
  case "list": {
    const rows = db.prepare("SELECT email, name, role, status, last_login_at FROM users ORDER BY role, email").all();
    if (rows.length === 0) console.log("\n  No accounts yet. Open /admin/setup to create the first owner.\n");
    else
      console.table(
        rows.map((r) => ({
          email: r.email,
          name: r.name,
          role: r.role,
          status: r.status,
          lastSignIn: r.last_login_at ? new Date(r.last_login_at).toISOString() : "never",
        }))
      );
    break;
  }

  case "reset-link": {
    const user = findUser(email);
    if (user.status !== "active") fail(`${user.email} is ${user.status}; only active accounts can reset a password.`);
    db.prepare("UPDATE users SET failed_logins = 0, locked_until = NULL WHERE id = ?").run(user.id);
    const token = issue(user.id, "reset", 24 * HOUR);
    log("console.reset_link", user.id, `Created a password reset link for ${user.name} from the server console`);
    console.log(`\n  Password reset link for ${user.email} (valid 24 hours, works once):\n\n  ${origin}/admin/reset/${token}\n`);
    break;
  }

  case "make-owner": {
    const user = findUser(email);
    db.prepare("UPDATE users SET role = 'owner', updated_at = ? WHERE id = ?").run(now, user.id);
    if (user.status === "disabled") {
      db.prepare("UPDATE users SET status = CASE WHEN password_hash IS NULL THEN 'invited' ELSE 'active' END WHERE id = ?").run(user.id);
    }
    log("console.made_owner", user.id, `Gave ${user.name} the Owner role from the server console`);
    console.log(`\n  ${user.email} is now an owner.\n`);
    break;
  }

  case "invite-owner": {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("Usage: invite-owner <email> <name>");
    const name = nameParts.join(" ").trim();
    if (name.length < 2) fail("Usage: invite-owner <email> <name>");
    const address = email.trim().toLowerCase();
    let user = db.prepare("SELECT id, status FROM users WHERE email = ?").get(address);
    if (user && user.status !== "invited") fail(`${address} already has an account. Use make-owner or reset-link.`);
    if (!user) {
      const id = randomUUID();
      db.prepare(
        "INSERT INTO users (id, email, name, role, status, created_at, updated_at) VALUES (?, ?, ?, 'owner', 'invited', ?, ?)"
      ).run(id, address, name, now, now);
      user = { id };
    } else {
      db.prepare("UPDATE users SET name = ?, role = 'owner', updated_at = ? WHERE id = ?").run(name, now, user.id);
    }
    const token = issue(user.id, "invite", 72 * HOUR);
    log("console.owner_invited", user.id, `Invited ${name} (${address}) as Owner from the server console`);
    console.log(`\n  Owner invite for ${address} (valid 72 hours, works once):\n\n  ${origin}/admin/invite/${token}\n`);
    break;
  }

  default:
    console.log(`
  Admin panel account recovery

  node scripts/admin-user.mjs list
  node scripts/admin-user.mjs reset-link <email>
  node scripts/admin-user.mjs make-owner <email>
  node scripts/admin-user.mjs invite-owner <email> <name>

  Options: --origin https://your-site  (defaults to NEXT_PUBLIC_SITE_URL)
`);
}

db.close();
