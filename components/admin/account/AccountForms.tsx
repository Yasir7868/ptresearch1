"use client";

import { useActionState, useState, useSyncExternalStore, useTransition } from "react";
import { BellRing, Monitor } from "lucide-react";
import { savePassword, saveName, signOutOtherDevices } from "@/app/admin/(panel)/account/actions";
import { IDLE, type ActionState } from "@/lib/admin/action-state";
import { PASSWORD_MIN_LENGTH } from "@/lib/admin/validation";
import type { SessionInfo } from "@/lib/admin/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldRow, FormMessage, SubmitButton, errorOf, fieldAria } from "../FormBits";
import { DESKTOP_ALERTS_KEY } from "../LiveOrders";
import { LocalTime } from "../LocalTime";
import { Pill } from "../StatusBadge";

export function NameForm({ name }: { name: string }) {
  const [state, action] = useActionState(saveName, IDLE);
  return (
    <form action={action} className="flex flex-col gap-3">
      <FieldRow id="account-name" label="Name" error={errorOf(state, "name")}>
        <Input {...fieldAria("account-name", errorOf(state, "name"))} name="name" defaultValue={name} required autoComplete="name" className="h-10 bg-surface" />
      </FieldRow>
      <FormMessage state={state} />
      <div>
        <SubmitButton pendingLabel="Saving…">Save name</SubmitButton>
      </div>
    </form>
  );
}

export function PasswordForm({ email }: { email: string }) {
  const [state, action] = useActionState(savePassword, IDLE);
  return (
    <form action={action} className="flex flex-col gap-3" key={state.status === "success" ? "done" : "form"}>
      <input type="text" name="username" value={email} autoComplete="username" readOnly hidden />
      <FieldRow id="current-password" label="Current password" error={errorOf(state, "current")}>
        <Input {...fieldAria("current-password", errorOf(state, "current"))} name="current" type="password" autoComplete="current-password" required className="h-10 bg-surface" />
      </FieldRow>
      <FieldRow id="new-password" label="New password" hint={`At least ${PASSWORD_MIN_LENGTH} characters.`} error={errorOf(state, "password")}>
        <Input {...fieldAria("new-password", errorOf(state, "password"), true)} name="password" type="password" autoComplete="new-password" minLength={PASSWORD_MIN_LENGTH} required className="h-10 bg-surface" />
      </FieldRow>
      <FieldRow id="confirm-password" label="Confirm new password" error={errorOf(state, "confirm")}>
        <Input {...fieldAria("confirm-password", errorOf(state, "confirm"))} name="confirm" type="password" autoComplete="new-password" required className="h-10 bg-surface" />
      </FieldRow>
      <FormMessage state={state} />
      <div>
        <SubmitButton pendingLabel="Changing…">Change password</SubmitButton>
      </div>
    </form>
  );
}

function deviceName(userAgent: string | null): string {
  if (!userAgent) return "Unknown device";
  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /Chrome\//.test(userAgent)
      ? "Chrome"
      : /Firefox\//.test(userAgent)
        ? "Firefox"
        : /Safari\//.test(userAgent)
          ? "Safari"
          : "Browser";
  const os = /iPhone|iPad/.test(userAgent)
    ? "iOS"
    : /Android/.test(userAgent)
      ? "Android"
      : /Windows/.test(userAgent)
        ? "Windows"
        : /Mac OS X/.test(userAgent)
          ? "macOS"
          : /Linux/.test(userAgent)
            ? "Linux"
            : "";
  return os ? `${browser} on ${os}` : browser;
}

export function SessionsList({ sessions }: { sessions: SessionInfo[] }) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<ActionState>(IDLE);
  const others = sessions.filter((s) => !s.current).length;

  return (
    <div className="flex flex-col gap-4">
      <ul className="divide-y divide-hairline/70">
        {sessions.map((s) => (
          <li key={s.key} className="flex items-start gap-3 py-3 first:pt-0">
            <Monitor aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ink-muted" />
            <span className="min-w-0 flex-1 text-sm">
              <span className="flex flex-wrap items-center gap-2 font-medium text-ink">
                {deviceName(s.userAgent)}
                {s.current && <Pill tone="info">This device</Pill>}
              </span>
              <span className="block text-[12.5px] text-ink-muted">
                {s.ip ?? "Unknown IP"} · active <LocalTime value={s.lastSeenAt} format="relative" /> · signed in{" "}
                <LocalTime value={s.createdAt} format="date" />
              </span>
            </span>
          </li>
        ))}
      </ul>
      <FormMessage state={state} />
      {others > 0 && (
        <div>
          <Button
            type="button"
            variant="outline"
            className="h-9 px-3"
            disabled={pending}
            onClick={() => startTransition(async () => setState(await signOutOtherDevices()))}
          >
            {pending ? "Signing out…" : `Sign out ${others} other device${others === 1 ? "" : "s"}`}
          </Button>
        </div>
      )}
    </div>
  );
}

const subscribeNoop = () => () => {};

function readAlertsSetting(): "on" | "off" | "blocked" | "unsupported" {
  if (typeof Notification === "undefined") return "unsupported";
  if (Notification.permission === "denied") return "blocked";
  try {
    return localStorage.getItem(DESKTOP_ALERTS_KEY) === "1" && Notification.permission === "granted" ? "on" : "off";
  } catch {
    return "off";
  }
}

/** Desktop notifications for new orders while an admin tab is open. */
export function DesktopAlertsToggle() {
  const initial = useSyncExternalStore(subscribeNoop, readAlertsSetting, () => "off" as const);
  const [override, setOverride] = useState<ReturnType<typeof readAlertsSetting> | null>(null);
  const setting = override ?? initial;

  const enable = async () => {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      try {
        localStorage.setItem(DESKTOP_ALERTS_KEY, "1");
      } catch {
        // Storage blocked: alerts stay off.
      }
      new Notification("Order alerts are on", { body: "You'll be notified here when a new order comes in." });
      setOverride("on");
    } else {
      setOverride(permission === "denied" ? "blocked" : "off");
    }
  };

  const disable = () => {
    try {
      localStorage.removeItem(DESKTOP_ALERTS_KEY);
    } catch {
      // nothing to clear
    }
    setOverride("off");
  };

  return (
    <div className="flex items-start gap-3 text-sm">
      <BellRing aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-green" />
      <div className="flex flex-col gap-3">
        <p className="text-ink">
          Get a desktop notification when a new order arrives, even while this tab is in the background. This browser
          only; the tab needs to stay open.
        </p>
        {setting === "unsupported" && <p className="text-ink-muted">This browser doesn&apos;t support notifications.</p>}
        {setting === "blocked" && (
          <p className="text-ink-muted">Notifications are blocked for this site. Allow them in your browser&apos;s site settings, then come back.</p>
        )}
        {setting === "on" && (
          <div className="flex items-center gap-3">
            <Pill tone="success">On in this browser</Pill>
            <Button type="button" variant="outline" className="h-8 px-2.5" onClick={disable}>
              Turn off
            </Button>
          </div>
        )}
        {setting === "off" && (
          <div>
            <Button type="button" variant="outline" className="h-9 px-3" onClick={enable}>
              Turn on order alerts
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
