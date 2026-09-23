/**
 * lib/admin/password.ts — SERVER-ONLY. Password hashing and one-time tokens.
 *
 * Passwords: scrypt (N=2^15, r=8, p=1, 64-byte key, 16-byte salt), stored as
 * `scrypt$N$r$p$salt$key` so parameters can be raised later without breaking
 * existing hashes (see needsRehash).
 *
 * Tokens (sessions, invite and reset links): 32 random bytes, base64url, handed
 * to the browser once. Only their SHA-256 is stored, so a leaked database
 * can't be used to sign in or accept an invite. scripts/admin-user.mjs mirrors
 * this token scheme; keep the two in step.
 */

import "server-only";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const N = 32768;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

function derive(
  password: string,
  salt: Buffer,
  keyLength: number,
  params: { N: number; r: number; p: number }
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password.normalize("NFKC"),
      salt,
      keyLength,
      { ...params, maxmem: Math.max(64 * 1024 * 1024, 256 * params.N * params.r) },
      (err, key) => (err ? reject(err) : resolve(key))
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await derive(password, salt, KEY_LENGTH, { N, r: R, p: P });
  return ["scrypt", N, R, P, salt.toString("base64url"), key.toString("base64url")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [n, r, p] = parts.slice(1, 4).map(Number);
  if (![n, r, p].every((v) => Number.isInteger(v) && v > 0)) return false;
  const salt = Buffer.from(parts[4]!, "base64url");
  const expected = Buffer.from(parts[5]!, "base64url");
  if (expected.length === 0) return false;
  const actual = await derive(password, salt, expected.length, { N: n!, r: r!, p: p! });
  return timingSafeEqual(actual, expected);
}

/** True when a stored hash uses weaker parameters than the current ones. */
export function needsRehash(stored: string): boolean {
  const parts = stored.split("$");
  return parts[0] !== "scrypt" || Number(parts[1]) < N || Number(parts[2]) !== R;
}

let dummyHash: Promise<string> | null = null;

/**
 * Burn the same scrypt time as a real check. Called when the email doesn't
 * match an account so response timing doesn't reveal which emails exist.
 */
export async function verifyAgainstDummy(password: string): Promise<void> {
  dummyHash ??= hashPassword(randomBytes(12).toString("hex"));
  await verifyPassword(password, await dummyHash);
}

export function createToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
