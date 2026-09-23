"use client";

/**
 * GatewayPayment — the embedded card surface on /checkout.
 *
 * Mounts the processor's embedded Checkout (Stripe.js, loaded by the SDK's
 * browser half) into `#embedded-checkout`. Card entry happens inside that
 * frame: no card number, CVC or expiry ever touches this site's DOM, which is
 * the whole reason for using the embedded surface rather than our own fields.
 *
 * WHAT THIS SENDS. Buyer details and product REFERENCES — ids and quantities.
 * No prices. The server re-prices from the live catalog, writes the order, and
 * returns its own totals (lib/orders/price.ts). This is why the SDK's
 * `fetchGatewayEmbeddedCheckoutSession` helper is not used: it posts a
 * browser-priced order, which is exactly what this route refuses to trust.
 * `mountGatewayEmbeddedCheckout` is still the SDK's.
 *
 * Two rules from the SDK README are load-bearing:
 *   1. Create the session ONCE per stable checkout id, never inside a render
 *      loop. `startedRef` guards against React 19 effect double-invocation.
 *   2. The checkout id must change when the cart changes, or the gateway's
 *      idempotency returns a session priced for the old cart. The parent
 *      derives it from a cart fingerprint (lib/gateway/order.ts).
 *
 * If the server's total differs from the cart's, `onRepriced` hands the parent
 * the server figure and the customer is shown it before paying. The server
 * number wins; it is the one being charged.
 */

import { useEffect, useRef, useState } from "react";
import { mountGatewayEmbeddedCheckout } from "@/lib/gateway/browser";
import type { GatewayEmbeddedCheckoutMount } from "@/lib/gateway/types";
import { assertSessionAmount } from "@/lib/gateway/order";
import { track } from "@/lib/analytics";
import { checkoutPage } from "@/content/site-copy";
import { Skeleton } from "@/components/ui/skeleton";

const SESSION_ENDPOINT = "/api/payment/embedded-session";

/** What the browser is allowed to say about a line: what it is, how many. */
export interface SubmittedLinePayload {
  productId: number;
  variationId?: number | undefined;
  qty: number;
  amountMinor?: number | undefined;
  meta?: { label: string; value: string }[] | undefined;
}

export interface CheckoutBuyerPayload {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | undefined;
  company?: string | undefined;
  address1: string;
  address2?: string | undefined;
  city: string;
  state: string;
  postcode: string;
  notes?: string | undefined;
}

interface SessionResponse {
  checkout_session_id: string;
  client_secret: string;
  publishable_key: string;
  connected_account_id?: string;
  amount: number;
  currency: string;
  order_key: string;
  order_number: string;
  totals: { total: number };
  error?: string;
}

export function GatewayPayment({
  checkoutId,
  buyer,
  lines,
  coupons,
  expectedTotalMinor,
  onPaid,
  onRepriced,
}: {
  /** Stable per cart state — see lib/gateway/order.ts `cartFingerprint`. */
  checkoutId: string;
  buyer: CheckoutBuyerPayload;
  lines: SubmittedLinePayload[];
  coupons: string[];
  /** The cart total in minor units, as the browser computed it. */
  expectedTotalMinor: number;
  /** Payment completed. Carries the gateway session and the order handle. */
  onPaid: (result: { sessionId: string; orderKey: string; orderNumber: string }) => void;
  /** The server priced the order differently from the cart. */
  onRepriced?: (serverTotalMinor: number) => void;
}) {
  const mountRef = useRef<GatewayEmbeddedCheckoutMount | null>(null);
  const startedRef = useRef<string | null>(null);
  const orderKeyRef = useRef<string | null>(null);
  const latest = useRef({ buyer, lines, coupons, onPaid, onRepriced });
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [retry, setRetry] = useState(0);

  // Keep callbacks and payload current without making them effect
  // dependencies — the session must not be recreated on a parent re-render.
  useEffect(() => {
    latest.current = { buyer, lines, coupons, onPaid, onRepriced };
  });

  useEffect(() => {
    // Rule 1: one session per checkout id, including across StrictMode's
    // double-invoked effects.
    if (startedRef.current === checkoutId) return;
    startedRef.current = checkoutId;

    let cancelled = false;
    setError("");
    setReady(false);

    void (async () => {
      try {
        const res = await fetch(SESSION_ENDPOINT, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            checkout_id: checkoutId,
            // Resume rather than duplicate if this checkout already has an order.
            ...(orderKeyRef.current ? { order_key: orderKeyRef.current } : {}),
            buyer: latest.current.buyer,
            lines: latest.current.lines,
            coupons: latest.current.coupons,
          }),
        });

        const session = (await res.json()) as SessionResponse;
        if (cancelled) return;

        if (!res.ok) {
          throw new Error(session.error || "Could not start payment.");
        }
        orderKeyRef.current = session.order_key;

        // The server's total is authoritative. Tell the parent if it differs
        // so the customer sees the real figure before paying.
        if (session.totals?.total !== expectedTotalMinor) {
          latest.current.onRepriced?.(session.totals.total);
        }
        // And the gateway's own amount must match the server's order.
        assertSessionAmount(session.amount, session.totals.total);

        const mounted = await mountGatewayEmbeddedCheckout({
          clientSecret: session.client_secret,
          publishableKey: session.publishable_key,
          ...(session.connected_account_id
            ? { connectedAccountId: session.connected_account_id }
            : {}),
          checkoutSelector: "#embedded-checkout",
          onReady: () => {
            if (!cancelled) setReady(true);
          },
          onComplete: () =>
            latest.current.onPaid({
              sessionId: session.checkout_session_id,
              orderKey: session.order_key,
              orderNumber: session.order_number,
            }),
        });

        if (cancelled) {
          mounted.destroy();
          return;
        }
        mountRef.current = mounted;
        setReady(true);
        track("payment_surface_ready", { checkout_id: checkoutId });
      } catch (caught) {
        if (cancelled) return;
        // Let a retry re-run the effect for this same id.
        startedRef.current = null;
        setError(
          caught instanceof Error
            ? caught.message
            : "Could not start payment. Please try again."
        );
      }
    })();

    return () => {
      cancelled = true;
      mountRef.current?.destroy();
      mountRef.current = null;
    };
    // `buyer`, `lines` and `expectedTotalMinor` are intentionally NOT
    // dependencies: the cart's contribution is already encoded in
    // `checkoutId`, and including them would recreate the session on every
    // parent render (SDK README rule 1). `retry` re-runs it deliberately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutId, retry]);

  if (error) {
    return (
      <div role="alert" className="rounded-xl border border-error/30 bg-error/5 p-5">
        <p className="text-[15px] font-medium text-error">{error}</p>
        <button
          type="button"
          onClick={() => {
            startedRef.current = null;
            setError("");
            setRetry((n) => n + 1);
          }}
          className="mt-3 cursor-pointer text-[14px] font-medium text-green underline underline-offset-2"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      {!ready && (
        <div aria-busy="true" className="flex flex-col gap-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}
      {/* The SDK mounts the processor's iframe here. */}
      <div id="embedded-checkout" />
      <p className="micro-label mt-4">{checkoutPage.paymentMethod.description}</p>
    </div>
  );
}
