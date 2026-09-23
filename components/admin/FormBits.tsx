"use client";

/**
 * Form helpers for admin Server Action forms: a pending-aware submit button,
 * the result message, labelled fields with inline errors, and a copy button
 * for invite/reset links.
 */

import { useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Check, CircleAlert, CircleCheck, Copy, LoaderCircle } from "lucide-react";
import type { ActionState } from "@/lib/admin/action-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LocalTime } from "./LocalTime";

export function SubmitButton({
  children,
  pendingLabel,
  className,
  variant,
  disabled,
}: {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variant}
      disabled={pending || disabled}
      aria-disabled={pending || disabled}
      className={cn("h-9 px-3.5", className)}
    >
      {pending && <LoaderCircle aria-hidden="true" className="animate-spin" />}
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}

export function FormMessage({ state, className }: { state: ActionState; className?: string }) {
  if (state.status === "idle") return null;
  const error = state.status === "error";
  return (
    <p
      role={error ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-lg px-3 py-2 text-sm",
        error
          ? "bg-[color-mix(in_oklab,var(--error)_9%,white)] text-error"
          : "bg-[color-mix(in_oklab,var(--ok)_10%,white)] text-[color-mix(in_oklab,var(--ok)_88%,black)]",
        className
      )}
    >
      {error ? (
        <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      ) : (
        <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      )}
      <span>{state.message}</span>
    </p>
  );
}

export function FieldRow({
  id,
  label,
  hint,
  error,
  children,
  className,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[13px] font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-[13px] text-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[12.5px] text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function errorOf(state: ActionState, field: string): string | undefined {
  return state.status === "error" ? state.fieldErrors?.[field] : undefined;
}

/** aria props for an input inside FieldRow. */
export function fieldAria(id: string, error?: string, hint?: boolean) {
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  } as const;
}

export const inputClass = "h-10 bg-surface text-[15px] md:text-sm";

export function CopyButton({ value, label = "Copy", className }: { value: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      className={cn("h-9 shrink-0 px-3", className)}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt("Copy this:", value);
        }
      }}
    >
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      {copied ? "Copied" : label}
    </Button>
  );
}

/** A one-time link (invite/reset) with a copy button and its expiry. */
export function LinkReveal({ url, expiresAt, note }: { url: string; expiresAt: number; note?: ReactNode }) {
  return (
    <div className="rounded-xl border border-hairline bg-paper p-3">
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={url}
          aria-label="Link"
          onFocus={(e) => e.currentTarget.select()}
          className="h-9 min-w-0 flex-1 rounded-lg border border-hairline bg-surface px-2.5 text-[13px] text-ink"
        />
        <CopyButton value={url} />
      </div>
      <p className="mt-2 text-[12.5px] text-ink-muted">
        Works once, until <LocalTime value={expiresAt} format="datetime" />. {note}
      </p>
    </div>
  );
}
