import type { Metadata } from "next";
import { OrderReceived } from "@/components/checkout/OrderReceived";

export const metadata: Metadata = {
  title: "Order received",
  description:
    "Demo order confirmation — payment instructions and next steps.",
};

export default function OrderReceivedPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-14 md:px-6 md:py-20">
      <OrderReceived />
    </main>
  );
}
