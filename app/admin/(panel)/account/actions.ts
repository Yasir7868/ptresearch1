"use server";

import { refresh } from "next/cache";
import { fail, ok, type ActionState } from "@/lib/admin/action-state";
import { actionError, formString } from "@/lib/admin/actions";
import { recordActivity } from "@/lib/admin/activity";
import { authorize } from "@/lib/admin/auth";
import { revokeSessions } from "@/lib/admin/session";
import { changePassword, updateName } from "@/lib/admin/users";
import { fieldErrors, nameSchema, newPasswordSchema } from "@/lib/admin/validation";

export async function saveName(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await authorize();
    const name = nameSchema.safeParse(formString(formData, "name"));
    if (!name.success) return fail("Check your name.", { name: name.error.issues[0]!.message });
    updateName(user.id, name.data);
    await recordActivity({ actor: { id: user.id, name: name.data }, action: "account.name_changed", target: { type: "account", id: user.id }, summary: `Changed their name from ${user.name} to ${name.data}` });
    refresh();
    return ok("Name saved.");
  } catch (err) {
    return actionError(err);
  }
}

export async function savePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await authorize();
    const current = formString(formData, "current");
    if (!current) return fail("Enter your current password.", { current: "Required." });
    const next = newPasswordSchema(user.email).safeParse({
      password: formString(formData, "password"),
      confirm: formString(formData, "confirm"),
    });
    if (!next.success) return fail("Fix the highlighted fields.", fieldErrors(next.error));
    if (next.data.password === current) return fail("Choose a password different from your current one.", { password: "Same as current." });

    await changePassword(user.id, current, next.data.password, user.sessionId);
    await recordActivity({
      actor: user,
      action: "auth.password_changed",
      target: { type: "account", id: user.id },
      summary: "Changed their password (signed out of other devices)",
    });
    refresh();
    return ok("Password changed. Your other devices were signed out.");
  } catch (err) {
    return actionError(err);
  }
}

export async function signOutOtherDevices(): Promise<ActionState> {
  try {
    const user = await authorize();
    const count = revokeSessions(user.id, user.sessionId);
    await recordActivity({
      actor: user,
      action: "auth.signed_out_others",
      target: { type: "account", id: user.id },
      summary: `Signed out of ${count} other device${count === 1 ? "" : "s"}`,
    });
    refresh();
    return ok(count ? `Signed out of ${count} other device${count === 1 ? "" : "s"}.` : "No other devices were signed in.");
  } catch (err) {
    return actionError(err);
  }
}
