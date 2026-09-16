import type { Metadata } from "next";
import { CartView } from "@/components/checkout/CartView";

export const metadata: Metadata = {
  title: "Cart",
  description:
    "Review the research compounds in your cart before checkout.",
};

export default function CartPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <CartView />
    </main>
  );
}
