"use server";

/**
 * Server Actions for the signed-out admin pages. Every action is rate
 * limited per client IP; sign-in also has a per-account lockout (users.ts).
 * Redirects happen outside try/catch so Next can handle them.
 */

import { createHash, timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { fail, type ActionState } from "@/lib/admin/action-state";
import { actionError, formString } from "@/lib/admin/actions";
import { recordActivity } from "@/lib/admin/activity";
import { setupToken } from "@/lib/admin/config";
import { rateLimit } from "@/lib/admin/rate-limit";
import { requestMeta, startSession } from "@/lib/admin/session";
import {
  acceptInvite,
  completePasswordReset,
  createFirstOwner,
  peekToken,
  verifyLogin,
  type AdminUser,
} from "@/lib/admin/users";
import { emailSchema, fieldErrors, nameSchema, newPasswordSchema } from "@/lib/admin/validation";

const WINDOW_MS = 15 * 60 * 1000;

async function limited(bucket: string, max: number): Promise<ActionState | null> {
  const { ip } = await requestMeta();
  const { allowed, retryAfterMs } = rateLimit(`${bucket}:${ip ?? "unknown"}`, max, WINDOW_MS);
  if (allowed) return null;
  const minutes = Math.max(1, Math.ceil(retryAfterMs / 60_000));
  return fail(`Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`);
}

/** Only allow redirects back into the admin panel. */
function safeNext(value: string): string {
  return /^\/admin(\/|$|\?)/.test(value) && !value.startsWith("/admin/login") && !/[\\\s]/.test(value)
    ? value
    : "/admin";
}

function sameSecret(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  // Per IP, so a shared office network gets headroom; accounts lock separately.
  const blocked = await limited("sign-in", 40);
  if (blocked) return blocked;

  const email = formString(formData, "email").trim().toLowerCase();
  const password = formString(formData, "password");
  if (!email || !password) return fail("Enter your email and password.");

  let user: AdminUser;
  try {
    const result = await verifyLogin(email, password);
    if (!result.ok) {
      if (result.reason === "locked") {
        const minutes = Math.max(1, Math.ceil((result.retryAt - Date.now()) / 60_000));
        return fail(
          `Too many incorrect passwords. This account is locked for ${minutes} more minute${minutes === 1 ? "" : "s"}.`
        );
      }
      return fail("That email and password don't match an account with access.");
    }
    user = result.user;
    await startSession(user.id);
  } catch (err) {
    return actionError(err);
  }

  await recordActivity({ actor: user, action: "auth.signed_in", target: { type: "account", id: user.id }, summary: "Signed in" });
  redirect(safeNext(formString(formData, "next")));
}

export async function setupOwner(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const blocked = await limited("setup", 10);
  if (blocked) return blocked;

  const expected = setupToken();
  if (!expected) {
    return fail("ADMIN_SETUP_TOKEN isn't set on the server (at least 16 characters). Set it and restart the app.");
  }
  if (!sameSecret(formString(formData, "token"), expected)) {
    return fail("Check the setup token.", { token: "That doesn't match ADMIN_SETUP_TOKEN." });
  }

  const email = emailSchema.safeParse(formString(formData, "email"));
  const name = nameSchema.safeParse(formString(formData, "name"));
  const passwords = newPasswordSchema(email.success ? email.data : undefined).safeParse({
    password: formString(formData, "password"),
    confirm: formString(formData, "confirm"),
  });
  const errors = {
    ...(email.success ? {} : { email: email.error.issues[0]!.message }),
    ...(name.success ? {} : { name: name.error.issues[0]!.message }),
    ...(passwords.success ? {} : fieldErrors(passwords.error)),
  };
  if (!email.success || !name.success || !passwords.success) {
    return fail("Fix the highlighted fields.", errors);
  }

  let user: AdminUser;
  try {
    user = await createFirstOwner({ name: name.data, email: email.data, password: passwords.data.password });
    await startSession(user.id);
  } catch (err) {
    return actionError(err);
  }

  await recordActivity({
    actor: user,
    action: "setup.owner_created",
    target: { type: "user", id: user.id },
    summary: "Created the admin panel and its first owner account",
  });
  redirect("/admin");
}

export async function acceptInviteAction(
  token: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const blocked = await limited("invite", 30);
  if (blocked) return blocked;

  const invite = peekToken(token, "invite");
  if (!invite) return fail("This invite link has expired or was already used. Ask an owner for a new one.");

  const name = nameSchema.safeParse(formString(formData, "name"));
  const passwords = newPasswordSchema(invite.user.email).safeParse({
    password: formString(formData, "password"),
    confirm: formString(formData, "confirm"),
  });
  if (!name.success || !passwords.success) {
    return fail("Fix the highlighted fields.", {
      ...(name.success ? {} : { name: name.error.issues[0]!.message }),
      ...(passwords.success ? {} : fieldErrors(passwords.error)),
    });
  }

  let user: AdminUser;
  try {
    user = await acceptInvite(token, { name: name.data, password: passwords.data.password });
    await startSession(user.id);
  } catch (err) {
    return actionError(err);
  }

  await recordActivity({
    actor: user,
    action: "team.invite_accepted",
    target: { type: "user", id: user.id },
    summary: "Accepted their invite and set a password",
  });
  redirect("/admin");
}

export async function resetPasswordAction(
  token: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const blocked = await limited("reset", 30);
  if (blocked) return blocked;

  const reset = peekToken(token, "reset");
  if (!reset) return fail("This reset link has expired or was already used. Ask an owner for a new one.");

  const passwords = newPasswordSchema(reset.user.email).safeParse({
    password: formString(formData, "password"),
    confirm: formString(formData, "confirm"),
  });
  if (!passwords.success) return fail("Fix the highlighted fields.", fieldErrors(passwords.error));

  let user: AdminUser;
  try {
    user = await completePasswordReset(token, passwords.data.password);
    await startSession(user.id);
  } catch (err) {
    return actionError(err);
  }

  await recordActivity({
    actor: user,
    action: "auth.password_reset",
    target: { type: "account", id: user.id },
    summary: "Set a new password with a reset link (signed out of other devices)",
  });
  redirect("/admin");
}
