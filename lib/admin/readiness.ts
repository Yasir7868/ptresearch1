/**
 * lib/admin/readiness.ts — SERVER-ONLY. Can the admin database be opened?
 * Pages that work before anyone signs in use this to explain a configuration
 * problem instead of crashing.
 *
 * Awaits connection() first: node:sqlite is synchronous, so without it a page
 * using only this check would be prerendered at build time with whatever the
 * database looked like then.
 */

import "server-only";
import { connection } from "next/server";
import { AdminConfigError } from "./config";
import { countUsers } from "./users";

export type Readiness = { ok: true; users: number } | { ok: false; message: string };

export async function adminReadiness(): Promise<Readiness> {
  await connection();
  try {
    return { ok: true, users: countUsers() };
  } catch (err) {
    if (err instanceof AdminConfigError) return { ok: false, message: err.message };
    console.error("[admin] database unavailable", err);
    return {
      ok: false,
      message:
        "The admin database couldn't be opened. Check that ADMIN_DB_PATH points to a writable location on persistent storage.",
    };
  }
}
