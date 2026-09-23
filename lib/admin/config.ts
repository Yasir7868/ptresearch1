/**
 * lib/admin/config.ts — SERVER-ONLY. Every environment variable the admin
 * panel reads, in one place. Secrets never leave this module unmasked.
 *
 *   WP_ORIGIN              WordPress/WooCommerce origin (shared with the storefront)
 *   WOO_CONSUMER_KEY       WooCommerce REST API key (Read/Write)  ck_…
 *   WOO_CONSUMER_SECRET    WooCommerce REST API secret            cs_…
 *   WOO_AUTH_MODE          "header" (default) or "query" for hosts that strip
 *                          the Authorization header
 *   WOO_WEBHOOK_SECRET     Secret WooCommerce signs webhook deliveries with
 *   ADMIN_DB_PATH          SQLite file for staff accounts, sessions, activity.
 *                          Must be on persistent storage in production (on
 *                          Railway, a volume; RAILWAY_VOLUME_MOUNT_PATH is used
 *                          automatically when a volume is attached).
 *   ADMIN_SETUP_TOKEN      One-time secret required to create the first owner
 */

import "server-only";
import { join } from "node:path";

export const IS_PRODUCTION = process.env.NODE_ENV === "production";

/** Thrown when required configuration is missing. Message is UI-safe. */
export class AdminConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminConfigError";
  }
}

function env(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

/** The WordPress origin, without a trailing slash. */
export function wpOrigin(): string {
  return (env("WP_ORIGIN") ?? "https://ptresearch.shop").replace(/\/+$/, "");
}

export interface WooCredentials {
  origin: string;
  consumerKey: string;
  consumerSecret: string;
  authMode: "header" | "query";
}

/** REST API credentials, or null when the store isn't connected yet. */
export function wooCredentials(): WooCredentials | null {
  const consumerKey = env("WOO_CONSUMER_KEY");
  const consumerSecret = env("WOO_CONSUMER_SECRET");
  if (!consumerKey || !consumerSecret) return null;
  return {
    origin: wpOrigin(),
    consumerKey,
    consumerSecret,
    authMode: env("WOO_AUTH_MODE")?.toLowerCase() === "query" ? "query" : "header",
  };
}

export function webhookSecret(): string | null {
  return env("WOO_WEBHOOK_SECRET");
}

/** Minimum length for ADMIN_SETUP_TOKEN; shorter values are treated as unset. */
export const SETUP_TOKEN_MIN_LENGTH = 16;

export function setupToken(): string | null {
  const token = env("ADMIN_SETUP_TOKEN");
  return token && token.length >= SETUP_TOKEN_MIN_LENGTH ? token : null;
}

export interface DbLocation {
  path: string;
  source: "ADMIN_DB_PATH" | "RAILWAY_VOLUME_MOUNT_PATH" | "development default";
}

/**
 * Where the admin database lives. In production an explicit, persistent
 * location is required: a default path inside the app directory would be
 * wiped on every deploy and silently delete every staff account.
 */
export function dbLocation(): DbLocation {
  const explicit = env("ADMIN_DB_PATH");
  if (explicit) return { path: explicit, source: "ADMIN_DB_PATH" };

  const volume = env("RAILWAY_VOLUME_MOUNT_PATH");
  if (volume) {
    return { path: join(volume, "admin.sqlite"), source: "RAILWAY_VOLUME_MOUNT_PATH" };
  }

  if (IS_PRODUCTION) {
    throw new AdminConfigError(
      "The admin database location is not configured. Attach a persistent volume and set ADMIN_DB_PATH (for example /data/admin.sqlite)."
    );
  }
  return { path: join(process.cwd(), ".data", "admin.sqlite"), source: "development default" };
}

/** "ck_1a2b…9f0e" — enough to recognise a key without revealing it. */
export function maskSecret(value: string | null): string | null {
  if (!value) return null;
  if (value.length <= 10) return "••••";
  return `${value.slice(0, 7)}…${value.slice(-4)}`;
}

export interface ConfigSummary {
  wpOrigin: string;
  wooConnected: boolean;
  consumerKey: string | null;
  consumerKeyLooksValid: boolean;
  consumerSecretSet: boolean;
  authMode: "header" | "query";
  originIsHttps: boolean;
  webhookSecretSet: boolean;
  setupTokenSet: boolean;
  db: DbLocation | { error: string };
}

/** Non-secret view of the configuration for the Settings page. */
export function configSummary(): ConfigSummary {
  const creds = wooCredentials();
  const key = env("WOO_CONSUMER_KEY");
  let db: ConfigSummary["db"];
  try {
    db = dbLocation();
  } catch (err) {
    db = { error: (err as Error).message };
  }
  return {
    wpOrigin: wpOrigin(),
    wooConnected: Boolean(creds),
    consumerKey: maskSecret(key),
    consumerKeyLooksValid: Boolean(key?.startsWith("ck_")),
    consumerSecretSet: Boolean(env("WOO_CONSUMER_SECRET")),
    authMode: creds?.authMode ?? "header",
    originIsHttps: wpOrigin().startsWith("https://"),
    webhookSecretSet: Boolean(webhookSecret()),
    setupTokenSet: Boolean(setupToken()),
    db,
  };
}
