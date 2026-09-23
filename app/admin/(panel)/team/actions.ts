"use server";

/**
 * Team Server Actions — only people with team.manage (owners). The rules
 * that keep the business from being locked out (last owner, no self-demotion)
 * live in lib/admin/users.ts, so they hold no matter which action is called.
 */

import { refresh } from "next/cache";
import { fail, ok, type ActionState } from "@/lib/admin/action-state";
import { actionError, formString, requestOrigin } from "@/lib/admin/actions";
import { recordActivity } from "@/lib/admin/activity";
import { authorize } from "@/lib/admin/auth";
import { ROLE_INFO, isRole } from "@/lib/admin/permissions";
import { revokeSessions } from "@/lib/admin/session";
import {
  changeRole,
  createResetLink,
  getUser,
  inviteUser,
  reissueInvite,
  removeUser,
  setDisabled,
} from "@/lib/admin/users";
import { emailSchema, nameSchema, roleSchema } from "@/lib/admin/validation";

export async function inviteMember(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const actor = await authorize("team.manage");
    const name = nameSchema.safeParse(formString(formData, "name"));
    const email = emailSchema.safeParse(formString(formData, "email"));
    const role = roleSchema.safeParse(formString(formData, "role"));
    if (!name.success || !email.success || !role.success) {
      return fail("Fix the highlighted fields.", {
        ...(name.success ? {} : { name: name.error.issues[0]!.message }),
        ...(email.success ? {} : { email: email.error.issues[0]!.message }),
        ...(role.success ? {} : { role: role.error.issues[0]!.message }),
      });
    }

    const { user, token, expiresAt } = inviteUser({ name: name.data, email: email.data, role: role.data }, actor.id);
    await recordActivity({
      actor,
      action: "team.invited",
      target: { type: "user", id: user.id },
      summary: `Invited ${user.name} (${user.email}) as ${ROLE_INFO[user.role].label}`,
    });
    refresh();
    return ok(`Invite created for ${user.name}. Send them this link:`, {
      url: `${await requestOrigin()}/admin/invite/${token}`,
      expiresAt,
    });
  } catch (err) {
    return actionError(err);
  }
}

export async function newInviteLink(userId: string): Promise<ActionState> {
  try {
    const actor = await authorize("team.manage");
    const { token, expiresAt } = reissueInvite(userId, actor.id);
    const user = getUser(userId);
    await recordActivity({
      actor,
      action: "team.invite_reissued",
      target: { type: "user", id: userId },
      summary: `Created a new invite link for ${user?.name ?? "a team member"}`,
    });
    refresh();
    return ok(`New invite link for ${user?.name ?? "this person"}. The previous link no longer works.`, {
      url: `${await requestOrigin()}/admin/invite/${token}`,
      expiresAt,
    });
  } catch (err) {
    return actionError(err);
  }
}

export async function passwordResetLink(userId: string): Promise<ActionState> {
  try {
    const actor = await authorize("team.manage");
    if (userId === actor.id) return fail("Change your own password from Your account.");
    const { token, expiresAt, user } = createResetLink(userId, actor.id);
    await recordActivity({
      actor,
      action: "team.reset_link_created",
      target: { type: "user", id: userId },
      summary: `Created a password reset link for ${user.name}`,
    });
    return ok(`Password reset link for ${user.name}:`, {
      url: `${await requestOrigin()}/admin/reset/${token}`,
      expiresAt,
    });
  } catch (err) {
    return actionError(err);
  }
}

export async function updateRole(userId: string, role: string): Promise<ActionState> {
  try {
    const actor = await authorize("team.manage");
    if (!isRole(role)) return fail("Choose a valid role.");
    const { before, user } = changeRole(userId, role, actor.id);
    if (before !== role) {
      await recordActivity({
        actor,
        action: "team.role_changed",
        target: { type: "user", id: userId },
        summary: `Changed ${user.name}'s role from ${ROLE_INFO[before].label} to ${ROLE_INFO[role].label}`,
      });
    }
    refresh();
    return ok(`${user.name}'s role is now ${ROLE_INFO[role].label}.`);
  } catch (err) {
    return actionError(err);
  }
}

export async function setAccess(userId: string, disabled: boolean): Promise<ActionState> {
  try {
    const actor = await authorize("team.manage");
    const user = setDisabled(userId, disabled, actor.id);
    await recordActivity({
      actor,
      action: disabled ? "team.disabled" : "team.enabled",
      target: { type: "user", id: userId },
      summary: disabled ? `Disabled ${user.name}'s access and signed them out` : `Re-enabled ${user.name}'s access`,
    });
    refresh();
    return ok(disabled ? `${user.name} can no longer sign in.` : `${user.name} can sign in again.`);
  } catch (err) {
    return actionError(err);
  }
}

export async function signOutMember(userId: string): Promise<ActionState> {
  try {
    const actor = await authorize("team.manage");
    if (userId === actor.id) return fail("Use Your account to sign out your other devices.");
    const user = getUser(userId);
    if (!user) return fail("That person no longer has an account.");
    const count = revokeSessions(userId);
    await recordActivity({
      actor,
      action: "team.signed_out",
      target: { type: "user", id: userId },
      summary: `Signed ${user.name} out of ${count} session${count === 1 ? "" : "s"}`,
    });
    return ok(`${user.name} was signed out everywhere.`);
  } catch (err) {
    return actionError(err);
  }
}

export async function removeMember(userId: string): Promise<ActionState> {
  try {
    const actor = await authorize("team.manage");
    const user = removeUser(userId, actor.id);
    await recordActivity({
      actor,
      action: "team.removed",
      target: { type: "user", id: userId },
      summary: `Removed ${user.name} (${user.email}) from the team`,
    });
    refresh();
    return ok(`${user.name} was removed.`);
  } catch (err) {
    return actionError(err);
  }
}
