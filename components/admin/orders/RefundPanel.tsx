"use client";

import { useActionState, useState } from "react";
import { Undo2 } from "lucide-react";
import { refundOrder } from "@/app/admin/(panel)/orders/actions";
import { IDLE, type ActionState } from "@/lib/admin/action-state";
import { formatMoney, toDecimalString } from "@/lib/admin/money";
import type { RefundView } from "@/lib/admin/woo/orders";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldRow, FormMessage, SubmitButton, errorOf, fieldAria } from "../FormBits";
import { LocalTime } from "../LocalTime";
import { Pill } from "../StatusBadge";

export function RefundPanel({
  orderId,
  refunds,
  totalMinor,
  refundedMinor,
  currency,
  paymentMethod,
  gatewayRefunds,
  canRefund,
}: {
  orderId: number;
  refunds: RefundView[];
  totalMinor: number;
  refundedMinor: number;
  currency: string;
  paymentMethod: string;
  gatewayRefunds: boolean;
  canRefund: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(async (prev: ActionState, formData: FormData) => {
    const result = await refundOrder(orderId, prev, formData);
    if (result.status === "success") setOpen(false);
    return result;
  }, IDLE);
  const [confirmed, setConfirmed] = useState(false);
  const remaining = Math.max(0, totalMinor - refundedMinor);

  return (
    <div className="flex flex-col gap-4">
      {refunds.length === 0 ? (
        <p className="text-sm text-ink-muted">No refunds on this order.</p>
      ) : (
        <ul className="divide-y divide-hairline/70">
          {refunds.map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-3 py-2.5 text-sm first:pt-0">
              <span className="min-w-0">
                <span className="block text-ink">{r.reason || "No reason given"}</span>
                <span className="mt-0.5 flex flex-wrap items-center gap-2 text-[12px] text-ink-muted">
                  <LocalTime value={r.createdAt} format="datetime" />
                  {r.refundedPayment && <Pill tone="info">Through payment gateway</Pill>}
                </span>
              </span>
              <span className="data-num shrink-0 text-error">−{formatMoney(r.amountMinor, currency)}</span>
            </li>
          ))}
        </ul>
      )}

      {state.status === "success" && <FormMessage state={state} />}

      {canRefund && remaining > 0 && (
        <div>
          <Button type="button" variant="outline" className="h-9 px-3" onClick={() => { setConfirmed(false); setOpen(true); }}>
            <Undo2 aria-hidden="true" /> Refund
          </Button>
        </div>
      )}

      {canRefund && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Refund this order</DialogTitle>
              <DialogDescription>
                Up to {formatMoney(remaining, currency)} can be refunded. WooCommerce marks the order Refunded once the full amount is refunded.
              </DialogDescription>
            </DialogHeader>
            <form action={action} className="flex flex-col gap-4">
              <FieldRow id="refund-amount" label={`Amount (${currency})`} error={errorOf(state, "amount")}>
                <Input
                  {...fieldAria("refund-amount", errorOf(state, "amount"))}
                  name="amount"
                  inputMode="decimal"
                  defaultValue={toDecimalString(remaining)}
                  required
                  className="h-10 bg-surface"
                />
              </FieldRow>
              <FieldRow id="refund-reason" label="Reason" hint="Stored on the refund in WooCommerce.">
                <Textarea id="refund-reason" name="reason" rows={2} maxLength={500} className="bg-surface" />
              </FieldRow>
              <fieldset className="flex flex-col gap-2 text-sm">
                <legend className="mb-1 text-[13px] font-medium text-ink">How is the money returned?</legend>
                <label className="flex items-start gap-2">
                  <input type="radio" name="method" value="manual" defaultChecked className="mt-1 accent-[var(--green)]" />
                  <span>
                    Record a manual refund
                    <span className="block text-[12.5px] text-ink-muted">You return the money yourself (e.g. Zelle, Venmo, store credit).</span>
                  </span>
                </label>
                <label className={`flex items-start gap-2 ${gatewayRefunds ? "" : "opacity-50"}`}>
                  <input type="radio" name="method" value="gateway" disabled={!gatewayRefunds} className="mt-1 accent-[var(--green)]" />
                  <span>
                    Refund through {paymentMethod || "the payment gateway"}
                    <span className="block text-[12.5px] text-ink-muted">
                      {gatewayRefunds ? "The gateway sends the money back to the customer's card." : "This payment method doesn't support automatic refunds."}
                    </span>
                  </span>
                </label>
              </fieldset>
              <label className="flex items-start gap-2 text-sm">
                <Checkbox checked={confirmed} onCheckedChange={(v) => setConfirmed(v === true)} className="mt-0.5 border-[color-mix(in_oklab,var(--ink-muted)_60%,white)]" aria-label="Confirm refund" />
                <span>I understand a refund can&apos;t be undone.</span>
              </label>
              <input type="hidden" name="confirm" value={confirmed ? "yes" : ""} />
              {state.status === "error" && <FormMessage state={state} />}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" className="h-9" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <SubmitButton variant="destructive" pendingLabel="Refunding…" disabled={!confirmed}>
                  Refund
                </SubmitButton>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
