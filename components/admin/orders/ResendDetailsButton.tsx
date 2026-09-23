"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { resendOrderDetails } from "@/app/admin/(panel)/orders/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "../Toaster";

export function ResendDetailsButton({ orderId, email }: { orderId: number; email: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  return (
    <>
      <Button type="button" variant="outline" className="h-9 px-3" disabled={!email} onClick={() => setOpen(true)}>
        <Send aria-hidden="true" /> Email details
      </Button>
      <Dialog open={open} onOpenChange={(v) => !pending && setOpen(v)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Email order details to the customer?</DialogTitle>
            <DialogDescription>
              WooCommerce sends its order details email (with a payment link if the order is unpaid) to {email}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={pending} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await resendOrderDetails(orderId);
                  setOpen(false);
                  if (result.status === "success") toast({ title: result.message, tone: "success" });
                  else if (result.status === "error") toast({ title: "Email not sent", description: result.message, tone: "error" });
                })
              }
            >
              {pending ? "Sending…" : "Send email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
