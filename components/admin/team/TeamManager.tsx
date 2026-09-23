"use client";

/**
 * Team list and invite flow. Every action returns an ActionState; one-time
 * links (invites, password resets) are shown once in a dialog with a copy
 * button — the panel has no email service, so the owner sends the link.
 */

import { useActionState, useState, useTransition } from "react";
import { Ellipsis, KeyRound, Link2, LogOut, Trash2, UserPlus, UserRoundCheck, UserRoundX } from "lucide-react";
import {
  inviteMember,
  newInviteLink,
  passwordResetLink,
  removeMember,
  setAccess,
  signOutMember,
  updateRole,
} from "@/app/admin/(panel)/team/actions";
import { IDLE, type ActionState } from "@/lib/admin/action-state";
import { ROLES, ROLE_INFO, type Role } from "@/lib/admin/permissions";
import type { TeamMember } from "@/lib/admin/users";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FieldRow, FormMessage, LinkReveal, SubmitButton, errorOf, fieldAria } from "../FormBits";
import { LocalTime } from "../LocalTime";
import { Pill } from "../StatusBadge";
import { useToast } from "../Toaster";
import { initials } from "../UserMenu";

type Confirm = { title: string; body: string; label: string; destructive?: boolean; run: () => Promise<ActionState> };

export function TeamManager({ members, currentUserId }: { members: TeamMember[]; currentUserId: string }) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [linkResult, setLinkResult] = useState<ActionState | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [inviting, setInviting] = useState(false);

  const run = (task: () => Promise<ActionState>, showLink = false) =>
    startTransition(async () => {
      const result = await task();
      setConfirm(null);
      if (result.status === "success" && result.link && showLink) setLinkResult(result);
      else if (result.status === "success") toast({ title: result.message, tone: "success" });
      else if (result.status === "error") toast({ title: "That didn't work", description: result.message, tone: "error", durationMs: 10_000 });
    });

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-hairline/70 px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold text-ink">People with access</h2>
          <p className="mt-0.5 text-[13px] text-ink-muted">{members.length} {members.length === 1 ? "person" : "people"}</p>
        </div>
        <Button type="button" className="h-9 px-3.5" onClick={() => setInviting(true)}>
          <UserPlus aria-hidden="true" /> Invite someone
        </Button>
      </div>

      <ul className={cn("divide-y divide-hairline/70", pending && "opacity-70")}>
        {members.map((m) => {
          const self = m.id === currentUserId;
          return (
            <li key={m.id} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold",
                    m.status === "disabled" ? "bg-secondary text-ink-muted" : "bg-[color-mix(in_oklab,var(--green)_12%,white)] text-green"
                  )}
                >
                  {initials(m.name)}
                </span>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-medium text-ink">
                    <span className="truncate">{m.name}</span>
                    {self && <Pill tone="info">You</Pill>}
                    {m.status === "invited" &&
                      (m.inviteExpiresAt ? <Pill tone="warning">Invite pending</Pill> : <Pill tone="danger">Invite expired</Pill>)}
                    {m.status === "disabled" && <Pill tone="muted">Disabled</Pill>}
                  </p>
                  <p className="truncate text-[13px] text-ink-muted">{m.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 md:w-[420px] md:justify-end">
                <span className="hidden text-[12.5px] text-ink-muted lg:block lg:w-36 lg:text-right">
                  {m.status === "invited" ? (
                    m.inviteExpiresAt ? (
                      <>
                        Expires <LocalTime value={m.inviteExpiresAt} format="relative" />
                      </>
                    ) : (
                      "Needs a new link"
                    )
                  ) : m.lastLoginAt ? (
                    <>
                      Signed in <LocalTime value={m.lastLoginAt} format="relative" />
                    </>
                  ) : (
                    "Never signed in"
                  )}
                </span>

                {self ? (
                  <span className="h-9 min-w-[150px] rounded-lg border border-hairline bg-paper px-3 text-sm leading-9 text-ink-muted">
                    {ROLE_INFO[m.role].label}
                  </span>
                ) : (
                  <select
                    aria-label={`Role for ${m.name}`}
                    value={m.role}
                    disabled={pending}
                    onChange={(e) => {
                      const role = e.target.value as Role;
                      setConfirm({
                        title: `Change ${m.name}'s role to ${ROLE_INFO[role].label}?`,
                        body: ROLE_INFO[role].summary,
                        label: "Change role",
                        run: () => updateRole(m.id, role),
                      });
                    }}
                    className="h-9 min-w-[150px] rounded-lg border border-input bg-surface px-2.5 text-sm text-ink"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_INFO[r].label}
                      </option>
                    ))}
                  </select>
                )}

                {!self && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className="size-9 shrink-0" disabled={pending}>
                        <Ellipsis aria-hidden="true" />
                        <span className="sr-only">More actions for {m.name}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-60">
                      {m.status === "invited" && (
                        <DropdownMenuItem onSelect={() => run(() => newInviteLink(m.id), true)}>
                          <Link2 /> New invite link
                        </DropdownMenuItem>
                      )}
                      {m.status === "active" && (
                        <>
                          <DropdownMenuItem onSelect={() => run(() => passwordResetLink(m.id), true)}>
                            <KeyRound /> Password reset link
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() =>
                              setConfirm({
                                title: `Sign ${m.name} out everywhere?`,
                                body: "They stay on the team and can sign in again straight away.",
                                label: "Sign out",
                                run: () => signOutMember(m.id),
                              })
                            }
                          >
                            <LogOut /> Sign out everywhere
                          </DropdownMenuItem>
                        </>
                      )}
                      {m.status === "disabled" ? (
                        <DropdownMenuItem onSelect={() => run(() => setAccess(m.id, false))}>
                          <UserRoundCheck /> Enable access
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onSelect={() =>
                            setConfirm({
                              title: `Disable ${m.name}'s access?`,
                              body: "They're signed out immediately and can't sign in until you enable them again. Their activity history is kept.",
                              label: "Disable access",
                              destructive: true,
                              run: () => setAccess(m.id, true),
                            })
                          }
                        >
                          <UserRoundX /> Disable access
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() =>
                          setConfirm({
                            title: `Remove ${m.name} from the team?`,
                            body: "Their account is deleted. Activity they recorded stays in the log. To give them access again you'd send a new invite.",
                            label: "Remove",
                            destructive: true,
                            run: () => removeMember(m.id),
                          })
                        }
                      >
                        <Trash2 /> Remove from team
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                {self && <span className="size-9 shrink-0" aria-hidden="true" />}
              </div>
            </li>
          );
        })}
      </ul>

      {inviting && <InviteDialog onClose={() => setInviting(false)} />}

      <Dialog open={confirm !== null} onOpenChange={(open) => !open && !pending && setConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{confirm?.title}</DialogTitle>
            <DialogDescription>{confirm?.body}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={pending} onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant={confirm?.destructive ? "destructive" : "default"}
              disabled={pending}
              onClick={() => confirm && run(confirm.run)}
            >
              {pending ? "Working…" : confirm?.label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={linkResult !== null} onOpenChange={(open) => !open && setLinkResult(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Share this link</DialogTitle>
            <DialogDescription>{linkResult?.status === "success" ? linkResult.message : null}</DialogDescription>
          </DialogHeader>
          {linkResult?.status === "success" && linkResult.link && (
            <LinkReveal
              url={linkResult.link.url}
              expiresAt={linkResult.link.expiresAt}
              note="Send it privately (not in a group chat); anyone with the link can use it."
            />
          )}
          <DialogFooter>
            <Button type="button" onClick={() => setLinkResult(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function InviteDialog({ onClose }: { onClose: () => void }) {
  const [state, action] = useActionState(inviteMember, IDLE);
  const [role, setRole] = useState<Role>("fulfillment");
  const done = state.status === "success" && state.link;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{done ? "Invite created" : "Invite someone"}</DialogTitle>
          <DialogDescription>
            {done
              ? state.message
              : "They get a link to set their own password. Nothing is emailed automatically: you send them the link."}
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <>
            <LinkReveal url={state.link!.url} expiresAt={state.link!.expiresAt} note="Send it privately; anyone with the link can accept it." />
            <DialogFooter>
              <Button type="button" onClick={onClose}>
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form action={action} className="flex flex-col gap-4">
            <FieldRow id="invite-name" label="Name" error={errorOf(state, "name")}>
              <Input {...fieldAria("invite-name", errorOf(state, "name"))} name="name" required autoFocus className="h-10 bg-surface" />
            </FieldRow>
            <FieldRow id="invite-email" label="Email" error={errorOf(state, "email")}>
              <Input {...fieldAria("invite-email", errorOf(state, "email"))} name="email" type="email" required className="h-10 bg-surface" />
            </FieldRow>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-[13px] font-medium text-ink">Role</legend>
              {ROLES.map((r) => (
                <label
                  key={r}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors",
                    role === r ? "border-green bg-[color-mix(in_oklab,var(--green)_5%,white)]" : "border-hairline hover:bg-paper"
                  )}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={role === r}
                    onChange={() => setRole(r)}
                    className="mt-1 accent-[var(--green)]"
                  />
                  <span>
                    <span className="block text-sm font-medium text-ink">{ROLE_INFO[r].label}</span>
                    <span className="block text-[12.5px] text-ink-muted">{ROLE_INFO[r].summary}</span>
                  </span>
                </label>
              ))}
            </fieldset>
            <FormMessage state={state} />
            <DialogFooter className="mx-0 mb-0 rounded-none border-0 bg-transparent p-0">
              <Button type="button" variant="outline" className="h-9" onClick={onClose}>
                Cancel
              </Button>
              <SubmitButton pendingLabel="Creating…">Create invite link</SubmitButton>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
