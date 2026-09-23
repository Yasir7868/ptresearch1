"use client";

/**
 * Order notes, newest first, exactly as WooCommerce stores them (so they
 * match WP admin and the WooCommerce app), plus a form to add a private note
 * or a note to the customer (WooCommerce emails those).
 */

import { useActionState, useState, useTransition } from "react";
import { Bot, Mail, StickyNote, Trash2 } from "lucide-react";
import { addNote, removeNote } from "@/app/admin/(panel)/orders/actions";
import { IDLE, type ActionState } from "@/lib/admin/action-state";
import type { OrderNoteView } from "@/lib/admin/woo/orders";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { FormMessage, SubmitButton, errorOf } from "../FormBits";
import { LocalTime } from "../LocalTime";
import { useToast } from "../Toaster";

const KIND = {
  customer: { label: "Note to customer", icon: Mail, className: "border-l-green bg-[color-mix(in_oklab,var(--green)_5%,white)]" },
  private: { label: "Private note", icon: StickyNote, className: "border-l-hairline bg-surface" },
  system: { label: "System", icon: Bot, className: "border-l-transparent bg-paper" },
} as const;

export function OrderNotes({
  orderId,
  notes,
  canAdd,
  canNotify,
  canDelete,
}: {
  orderId: number;
  notes: OrderNoteView[];
  canAdd: boolean;
  canNotify: boolean;
  canDelete: boolean;
}) {
  const toast = useToast();
  const [audience, setAudience] = useState<"private" | "customer">("private");
  // Bumped after each saved note: the form remounts empty, back on "Private".
  const [formKey, setFormKey] = useState(0);
  const [state, action] = useActionState(async (prev: ActionState, formData: FormData) => {
    const result = await addNote(orderId, prev, formData);
    if (result.status === "success") {
      toast({ title: result.message, tone: "success" });
      setAudience("private");
      setFormKey((k) => k + 1);
      return IDLE;
    }
    return result;
  }, IDLE);
  const [deleting, startDelete] = useTransition();
  const noteError = errorOf(state, "note");

  return (
    <div className="flex flex-col gap-5">
      {canAdd && (
        <form
          action={action}
          onReset={() => setAudience("private")}
          className="flex flex-col gap-3"
          key={formKey}
        >
          <label htmlFor="new-note" className="sr-only">
            New note
          </label>
          <Textarea
            id="new-note"
            name="note"
            rows={3}
            maxLength={4000}
            required
            aria-invalid={noteError ? true : undefined}
            placeholder={audience === "customer" ? "Message to the customer…" : "Add a private note for the team…"}
            className="bg-surface"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <fieldset className="flex flex-wrap gap-4 text-sm">
              <legend className="sr-only">Who sees this note</legend>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="audience"
                  value="private"
                  defaultChecked
                  onChange={() => setAudience("private")}
                  className="accent-[var(--green)]"
                />
                Private note
              </label>
              {canNotify && (
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="audience"
                    value="customer"
                    onChange={() => setAudience("customer")}
                    className="accent-[var(--green)]"
                  />
                  Note to customer
                </label>
              )}
            </fieldset>
            <SubmitButton pendingLabel="Adding…">{audience === "customer" ? "Email note to customer" : "Add note"}</SubmitButton>
          </div>
          {audience === "customer" && (
            <p className="text-[12.5px] text-ink-muted">WooCommerce emails this note to the customer and shows it in their account.</p>
          )}
          <FormMessage state={state} />
        </form>
      )}

      {notes.length === 0 ? (
        <p className="text-sm text-ink-muted">No notes on this order yet.</p>
      ) : (
        <ol className={cn("flex flex-col gap-2.5", deleting && "opacity-60")}>
          {notes.map((note) => {
            const kind = KIND[note.kind];
            const Icon = kind.icon;
            return (
              <li key={note.id} className={cn("rounded-xl border border-hairline/70 border-l-[3px] px-4 py-3", kind.className)}>
                <div className="flex items-start justify-between gap-3">
                  <p className={cn("text-sm whitespace-pre-wrap text-ink", note.kind === "system" && "text-[13px] text-ink-muted")}>
                    {note.body}
                  </p>
                  {canDelete && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="-mt-1 -mr-2 shrink-0 text-ink-muted hover:text-error"
                      disabled={deleting}
                      onClick={() => {
                        if (!window.confirm("Delete this note from the order? This can't be undone.")) return;
                        startDelete(async () => {
                          const result = await removeNote(orderId, note.id);
                          if (result.status === "error") toast({ title: "Couldn't delete the note", description: result.message, tone: "error" });
                        });
                      }}
                    >
                      <Trash2 aria-hidden="true" />
                      <span className="sr-only">Delete note</span>
                    </Button>
                  )}
                </div>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-ink-muted">
                  <span className="inline-flex items-center gap-1">
                    <Icon aria-hidden="true" className="size-3.5" /> {kind.label}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{note.author}</span>
                  <span aria-hidden="true">·</span>
                  <LocalTime value={note.createdAt} format="datetime" />
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
