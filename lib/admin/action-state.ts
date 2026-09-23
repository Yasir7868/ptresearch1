/**
 * lib/admin/action-state.ts — the shape every admin Server Action returns to
 * its form (via useActionState). Client-safe.
 */

export type ActionState =
  | { status: "idle" }
  | { status: "success"; message: string; link?: { url: string; expiresAt: number } }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

export const IDLE: ActionState = { status: "idle" };

export function ok(message: string, link?: { url: string; expiresAt: number }): ActionState {
  return link ? { status: "success", message, link } : { status: "success", message };
}

export function fail(message: string, fieldErrors?: Record<string, string>): ActionState {
  return fieldErrors ? { status: "error", message, fieldErrors } : { status: "error", message };
}
