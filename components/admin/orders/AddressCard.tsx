"use client";

import { useActionState, useState } from "react";
import { Mail, Pencil, Phone } from "lucide-react";
import { saveAddress } from "@/app/admin/(panel)/orders/actions";
import { IDLE, type ActionState } from "@/lib/admin/action-state";
import type { AddressView } from "@/lib/admin/woo/orders";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CopyButton, FieldRow, FormMessage, SubmitButton, errorOf, fieldAria } from "../FormBits";

const FIELDS: { name: keyof AddressView; label: string; autoComplete: string; wide?: boolean }[] = [
  { name: "firstName", label: "First name", autoComplete: "given-name" },
  { name: "lastName", label: "Last name", autoComplete: "family-name" },
  { name: "company", label: "Company", autoComplete: "organization", wide: true },
  { name: "address1", label: "Address line 1", autoComplete: "address-line1", wide: true },
  { name: "address2", label: "Address line 2", autoComplete: "address-line2", wide: true },
  { name: "city", label: "City", autoComplete: "address-level2" },
  { name: "state", label: "State", autoComplete: "address-level1" },
  { name: "postcode", label: "ZIP / Postcode", autoComplete: "postal-code" },
  { name: "country", label: "Country code", autoComplete: "country" },
  { name: "phone", label: "Phone", autoComplete: "tel" },
];

export function AddressCard({
  orderId,
  kind,
  address,
  canEdit,
}: {
  orderId: number;
  kind: "billing" | "shipping";
  address: AddressView;
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(async (prev: ActionState, formData: FormData) => {
    const result = await saveAddress(orderId, kind, prev, formData);
    if (result.status === "success") setOpen(false);
    return result;
  }, IDLE);
  const empty = address.lines.length === 0;

  return (
    <div className="flex flex-col gap-3">
      {empty ? (
        <p className="text-sm text-ink-muted">No {kind} address on this order.</p>
      ) : (
        <address className="text-sm leading-relaxed text-ink not-italic">
          {address.lines.map((line, i) => (
            <span key={i} className={i === 0 ? "block font-medium" : "block"}>
              {line}
            </span>
          ))}
        </address>
      )}
      {(address.email || address.phone) && (
        <div className="flex flex-col gap-1 text-sm">
          {address.email && (
            <a href={`mailto:${address.email}`} className="inline-flex items-center gap-2 break-all text-green underline-offset-4 hover:underline">
              <Mail aria-hidden="true" className="size-4 shrink-0" /> {address.email}
            </a>
          )}
          {address.phone && (
            <a href={`tel:${address.phone}`} className="inline-flex items-center gap-2 text-green underline-offset-4 hover:underline">
              <Phone aria-hidden="true" className="size-4 shrink-0" /> {address.phone}
            </a>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {!empty && <CopyButton value={address.lines.join("\n")} label="Copy address" className="h-8" />}
        {canEdit && (
          <Button type="button" variant="outline" className="h-8 px-3" onClick={() => setOpen(true)}>
            <Pencil aria-hidden="true" /> Edit
          </Button>
        )}
      </div>

      {canEdit && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit {kind} address</DialogTitle>
              <DialogDescription>Saved to the order in WooCommerce. A private note records the change.</DialogDescription>
            </DialogHeader>
            <form action={action} className="grid grid-cols-2 gap-3">
              {FIELDS.map((field) => {
                const id = `${kind}-${field.name}`;
                const error = errorOf(state, field.name);
                return (
                  <FieldRow key={field.name} id={id} label={field.label} error={error} className={field.wide ? "col-span-2" : "col-span-2 sm:col-span-1"}>
                    <Input
                      {...fieldAria(id, error)}
                      name={field.name}
                      defaultValue={String(address[field.name] ?? "")}
                      autoComplete={field.autoComplete}
                      className="h-9 bg-surface"
                    />
                  </FieldRow>
                );
              })}
              {kind === "billing" && (
                <FieldRow id="billing-email" label="Email" error={errorOf(state, "email")} className="col-span-2">
                  <Input {...fieldAria("billing-email", errorOf(state, "email"))} name="email" type="email" defaultValue={address.email} className="h-9 bg-surface" />
                </FieldRow>
              )}
              <div className="col-span-2 flex flex-col gap-3">
                <FormMessage state={state} />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" className="h-9" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <SubmitButton pendingLabel="Saving…">Save address</SubmitButton>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
