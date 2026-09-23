import type { Metadata } from "next";
import { cartPage, sideCartCopy } from "@/content/site-copy";
import { CartView } from "@/components/checkout/CartView";

export const metadata: Metadata = {
  title: cartPage.title,
  description: sideCartCopy.note,
};

export default function CartPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-20">
      <CartView />
    </main>
  );
}
