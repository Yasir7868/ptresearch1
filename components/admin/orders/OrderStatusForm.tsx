"use client";

/**
 * Change an order's status (with an optional private note).
 *
 * The parent keys this component on the order's current status, so after a
 * change it remounts with the new status selected. The select is uncontrolled
 * on purpose: React 19 resets a form after its action runs, and a reset
 * restores defaultValue — a controlled select would visually snap to its
 * first option while state said otherwise.
 */

import { useActionState, useState } from "react";
import { changeOrderStatus } from "@/app/admin/(panel)/orders/actions";
import { IDLE, type ActionState } from "@/lib/admin/action-state";
import { CUSTOMER_EMAIL_STATUSES, statusMeta } from "@/lib/admin/order-status";
import { Textarea } from "@/components/ui/textarea";
import { FormMessage, SubmitButton } from "../FormBits";
import { useToast } from "../Toaster";

export function OrderStatusForm({
  orderId,
  current,
  statuses,
}: {
  orderId: number;
  current: string;
  statuses: { slug: string; name: string }[];
}) {
  const toast = useToast();
  const [next, setNext] = useState(current);
  const [state, action] = useActionState(async (prev: ActionState, formData: FormData) => {
    const result = await changeOrderStatus(orderId, prev, formData);
    if (result.status === "success") {
      toast({ title: result.message, tone: "success" });
      return IDLE;
    }
    return result;
  }, IDLE);
  const changing = next !== current;
  const meta = statusMeta(next, statuses.find((s) => s.slug === next)?.name);

  return (
    <form action={action} onReset={() => setNext(current)} className="flex flex-col gap-3">
      <label htmlFor="order-status" className="sr-only">
        Order status
      </label>
      <select
        id="order-status"
        name="status"
        defaultValue={current}
        onChange={(e) => setNext(e.target.value)}
        className="h-10 w-full rounded-lg border border-input bg-surface px-3 text-sm text-ink outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {statuses.map((s) => (
          <option key={s.slug} value={s.slug}>
            {statusMeta(s.slug, s.name).label}
            {s.slug === current ? " (current)" : ""}
          </option>
        ))}
      </select>
      <p className="text-[13px] text-ink-muted">
        {meta.description}
        {changing && CUSTOMER_EMAIL_STATUSES.has(next) && " WooCommerce may email the customer about this change."}
      </p>
      <label htmlFor="status-note" className="text-[13px] font-medium text-ink">
        Private note <span className="font-normal text-ink-muted">(optional)</span>
      </label>
      <Textarea id="status-note" name="note" rows={2} maxLength={2000} placeholder="e.g. Shipped with USPS, tracking 9400…" className="bg-surface" />
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Saving…" className="w-full">
        {changing ? `Mark as ${meta.label}` : "Save note"}
      </SubmitButton>
    </form>
  );
}
