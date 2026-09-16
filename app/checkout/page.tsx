import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "Demo checkout — payment connects to the store backend at launch.",
};

export default function CheckoutPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-20">
      {/* Slim prototype notice — honest, soft */}
      <div className="soft-card px-4 py-3">
        <p className="micro-label">
          Prototype — orders are not transmitted; payment connects to the
          store backend at launch
        </p>
      </div>

      <div className="hairline-b mt-10 mb-10 pb-6">
        <p className="micro-label">Order record</p>
        <h1 className="mt-2 text-[clamp(1.9rem,3.4vw,3rem)]">Checkout</h1>
      </div>

      <CheckoutForm />
    </main>
  );
}
