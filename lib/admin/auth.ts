/**
 * lib/admin/auth.ts — SERVER-ONLY. The authorization layer every admin page,
 * Server Action and route handler goes through.
 *
 *   Pages:           const user = await requirePermission("orders.view");
 *   Server Actions:  const user = await authorize("orders.update");
 *   Route handlers:  const user = await getCurrentUser(); + can(...)
 *
 * proxy.ts only does a cheap "is there a session cookie" redirect. The real
 * check is here, against the database, on every request — layouts don't
 * re-render on client navigation, so pages must call these themselves.
 */

import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminConfigError } from "./config";
import { can, PERMISSION_INFO, type Permission } from "./permissions";
import { readSession, type SessionUser } from "./session";

export type { SessionUser } from "./session";

/** Signed-in person, or null (also null while the database isn't configured). */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    return await readSession();
  } catch (err) {
    if (err instanceof AdminConfigError) return null;
    throw err;
  }
}

/** Path + query of the admin page being rendered (set by proxy.ts). */
async function currentAdminPath(): Promise<string | null> {
  const path = (await headers()).get("x-pt-admin-path");
  return path && path.startsWith("/admin") ? path : null;
}

export function loginUrl(next?: string | null): string {
  return next && next !== "/admin" ? `/admin/login?next=${encodeURIComponent(next)}` : "/admin/login";
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl(await currentAdminPath()));
  return user;
}

export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user.role, permission)) {
    redirect(`/admin/no-access?need=${encodeURIComponent(permission)}`);
  }
  return user;
}

/** Thrown by authorize(); its message is shown to the person. */
export class ActionDenied extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActionDenied";
  }
}

/** For Server Actions: the signed-in person with the permission, or throws. */
export async function authorize(permission?: Permission): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new ActionDenied("Your session has ended. Sign in again to continue.");
  if (permission && !can(user.role, permission)) {
    throw new ActionDenied(
      `Your role doesn't allow this (${PERMISSION_INFO[permission].label.toLowerCase()}).`
    );
  }
  return user;
}
