/**
 * /order-received — order confirmation.
 *
 * Two sources, in order of authority:
 *   1. `?order=<orderKey>` — the stored order (lib/orders/store.ts). This is
 *      the real record: server-priced, callback-settled, and the same thing
 *      staff see. It survives a reload, a different device, or opening the
 *      link a week later.
 *   2. No key — the sessionStorage receipt from this browser, which is all a
 *      pre-gateway order ever had.
 *
 * The order key is an unguessable token, so it can identify an order in a URL
 * without an account system. An unknown key falls through to the client
 * fallback rather than 404ing: the customer may still have a local receipt.
 */

import type { Metadata } from "next";
import { orderReceivedPage } from "@/content/site-copy";
import { OrderReceived } from "@/components/checkout/OrderReceived";
import { OrderConfirmation } from "@/components/checkout/OrderConfirmation";
import { getOrderByKey } from "@/lib/orders/store";

export const metadata: Metadata = {
  title: "Order received",
  description: orderReceivedPage.heading,
};

// Reads an order row; never prerendered.
export const dynamic = "force-dynamic";

export default async function OrderReceivedPage({
  searchParams,
}: {
  // Next.js 16: searchParams is a Promise.
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderKey } = await searchParams;
  const order = orderKey ? getOrderByKey(orderKey) : null;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-14 md:px-6 md:py-20">
      {order ? <OrderConfirmation order={order} /> : <OrderReceived />}
    </main>
  );
}
