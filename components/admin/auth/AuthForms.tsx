"use client";

/**
 * The signed-out admin forms: sign in, create the first owner, accept an
 * invite, set a new password from a reset link. Each posts to a Server Action
 * (app/admin/(auth)/actions.ts) and works without JavaScript too.
 */

import { useActionState } from "react";
import {
  acceptInviteAction,
  resetPasswordAction,
  setupOwner,
  signIn,
} from "@/app/admin/(auth)/actions";
import { IDLE } from "@/lib/admin/action-state";
import { PASSWORD_MIN_LENGTH } from "@/lib/admin/validation";
import { Input } from "@/components/ui/input";
import { FieldRow, FormMessage, SubmitButton, errorOf, fieldAria, inputClass } from "../FormBits";

export const PASSWORD_HINT = `At least ${PASSWORD_MIN_LENGTH} characters. A short sentence works well.`;

export function SignInForm({ next }: { next: string }) {
  const [state, action] = useActionState(signIn, IDLE);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <FieldRow id="email" label="Email">
        <Input {...fieldAria("email")} name="email" type="email" autoComplete="username" required autoFocus className={inputClass} />
      </FieldRow>
      <FieldRow id="password" label="Password">
        <Input {...fieldAria("password")} name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </FieldRow>
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Signing in…" className="mt-1 h-10 w-full">
        Sign in
      </SubmitButton>
    </form>
  );
}

export function SetupForm() {
  const [state, action] = useActionState(setupOwner, IDLE);
  return (
    <form action={action} className="flex flex-col gap-4">
      <FieldRow
        id="token"
        label="Setup token"
        hint="The value of ADMIN_SETUP_TOKEN in the server's environment."
        error={errorOf(state, "token")}
      >
        <Input {...fieldAria("token", errorOf(state, "token"), true)} name="token" type="password" autoComplete="off" required className={inputClass} />
      </FieldRow>
      <FieldRow id="name" label="Your name" error={errorOf(state, "name")}>
        <Input {...fieldAria("name", errorOf(state, "name"))} name="name" autoComplete="name" required className={inputClass} />
      </FieldRow>
      <FieldRow id="email" label="Email" error={errorOf(state, "email")}>
        <Input {...fieldAria("email", errorOf(state, "email"))} name="email" type="email" autoComplete="username" required className={inputClass} />
      </FieldRow>
      <FieldRow id="password" label="Password" hint={PASSWORD_HINT} error={errorOf(state, "password")}>
        <Input
          {...fieldAria("password", errorOf(state, "password"), true)}
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          required
          className={inputClass}
        />
      </FieldRow>
      <FieldRow id="confirm" label="Confirm password" error={errorOf(state, "confirm")}>
        <Input {...fieldAria("confirm", errorOf(state, "confirm"))} name="confirm" type="password" autoComplete="new-password" required className={inputClass} />
      </FieldRow>
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Creating account…" className="mt-1 h-10 w-full">
        Create owner account
      </SubmitButton>
    </form>
  );
}

export function AcceptInviteForm({ token, name, email }: { token: string; name: string; email: string }) {
  const [state, action] = useActionState(acceptInviteAction.bind(null, token), IDLE);
  return (
    <form action={action} className="flex flex-col gap-4">
      <FieldRow id="email" label="Email">
        <Input id="email" value={email} readOnly autoComplete="username" className={`${inputClass} bg-paper text-ink-muted`} />
      </FieldRow>
      <FieldRow id="name" label="Your name" error={errorOf(state, "name")}>
        <Input {...fieldAria("name", errorOf(state, "name"))} name="name" defaultValue={name} autoComplete="name" required className={inputClass} />
      </FieldRow>
      <FieldRow id="password" label="Choose a password" hint={PASSWORD_HINT} error={errorOf(state, "password")}>
        <Input
          {...fieldAria("password", errorOf(state, "password"), true)}
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          required
          autoFocus
          className={inputClass}
        />
      </FieldRow>
      <FieldRow id="confirm" label="Confirm password" error={errorOf(state, "confirm")}>
        <Input {...fieldAria("confirm", errorOf(state, "confirm"))} name="confirm" type="password" autoComplete="new-password" required className={inputClass} />
      </FieldRow>
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Setting up…" className="mt-1 h-10 w-full">
        Accept invite
      </SubmitButton>
    </form>
  );
}

export function ResetPasswordForm({ token, email }: { token: string; email: string }) {
  const [state, action] = useActionState(resetPasswordAction.bind(null, token), IDLE);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="text" name="username" value={email} autoComplete="username" readOnly hidden />
      <FieldRow id="password" label="New password" hint={PASSWORD_HINT} error={errorOf(state, "password")}>
        <Input
          {...fieldAria("password", errorOf(state, "password"), true)}
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          required
          autoFocus
          className={inputClass}
        />
      </FieldRow>
      <FieldRow id="confirm" label="Confirm new password" error={errorOf(state, "confirm")}>
        <Input {...fieldAria("confirm", errorOf(state, "confirm"))} name="confirm" type="password" autoComplete="new-password" required className={inputClass} />
      </FieldRow>
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Saving…" className="mt-1 h-10 w-full">
        Save password and sign in
      </SubmitButton>
    </form>
  );
}
