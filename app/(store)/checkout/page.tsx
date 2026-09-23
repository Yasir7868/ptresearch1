/**
 * /checkout — two-step checkout: order details, then the payment processor's
 * embedded card surface (components/checkout/GatewayPayment.tsx).
 *
 * Server component so the gateway's readiness is decided server-side:
 * `gatewayConfigured()` reads server-only env, and only the boolean crosses
 * to the client. The merchant token never leaves the server.
 *
 * Deployments without gateway credentials render the same form with payment
 * disabled and a plain notice, rather than a button that cannot charge.
 */

import type { Metadata } from "next";
import { checkoutPage } from "@/content/site-copy";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { gatewayConfigured } from "@/lib/gateway/config";

export const metadata: Metadata = {
  title: checkoutPage.title,
  description: checkoutPage.paymentMethod.description,
};

// Gateway readiness is environment state, not build state.
export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <div className="hairline-b mt-2 mb-10 pb-6">
        <h1 className="text-[clamp(1.9rem,3.4vw,3rem)]">{checkoutPage.title}</h1>
      </div>

      <CheckoutForm paymentEnabled={gatewayConfigured()} />
    </main>
  );
}
