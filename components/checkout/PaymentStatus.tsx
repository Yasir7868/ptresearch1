"use client";

/**
 * PaymentStatus — the confirmation page's payment banner.
 *
 * The customer's browser can reach /order-received before the processor's
 * server-to-server callback has landed, so the page must not infer "paid" from
 * the fact that a redirect happened. This asks /api/payment/reconcile, which
 * answers from the verified callback when one exists and otherwise asks the
 * gateway.
 *
 * Deliberately never says "paid" on its own authority: an unknown or failed
 * status shows the order number and how to reach us instead. Wrong money
 * information is worse than none.
 */

import { useEffect, useState } from "react";
import { checkoutPayment, contactInfo } from "@/content/site-copy";
import { cn } from "@/lib/utils";

type State =
  | { phase: "loading" }
  | { phase: "paid" }
  | { phase: "pending" }
  | { phase: "unknown" };

/** Statuses the gateway/Stripe use for a settled payment. */
const PAID = new Set(["paid", "succeeded", "complete", "completed"]);
/** Statuses that mean "not settled yet", as opposed to failed. */
const PENDING = new Set(["processing", "pending", "requires_capture", "open"]);

export function PaymentStatus({
  sessionId,
  orderId,
  orderKey,
}: {
  sessionId: string;
  orderId?: string | undefined;
  orderKey?: string | undefined;
}) {
  const [state, setState] = useState<State>({ phase: "loading" });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch("/api/payment/reconcile", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            order_id: orderId,
            order_key: orderKey,
          }),
        });
        if (cancelled) return;

        if (!res.ok) {
          setState({ phase: "unknown" });
          return;
        }

        const body = (await res.json()) as { payment_status?: string };
        const status = (body.payment_status ?? "").toLowerCase();
        if (cancelled) return;

        if (PAID.has(status)) setState({ phase: "paid" });
        else if (PENDING.has(status)) setState({ phase: "pending" });
        else setState({ phase: "unknown" });
      } catch {
        if (!cancelled) setState({ phase: "unknown" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId, orderId, orderKey]);

  const message =
    state.phase === "loading"
      ? checkoutPayment.confirming
      : state.phase === "paid"
        ? checkoutPayment.confirmedPaid
        : state.phase === "pending"
          ? checkoutPayment.confirmedPending
          : checkoutPayment.confirmFailed;

  return (
    <p
      role="status"
      aria-live="polite"
      className={cn(
        "soft-card flex flex-wrap items-center gap-2 px-4 py-3 text-[14px]",
        state.phase === "paid" ? "text-ink" : "text-ink-muted"
      )}
    >
      {state.phase === "paid" && (
        <span aria-hidden="true" className="inline-block size-1.5 rounded-full bg-ok" />
      )}
      <span>{message}</span>
      {state.phase === "unknown" && (
        <a
          href={`mailto:${contactInfo.email}`}
          className="font-medium text-green underline underline-offset-2"
        >
          {contactInfo.email}
        </a>
      )}
    </p>
  );
}
