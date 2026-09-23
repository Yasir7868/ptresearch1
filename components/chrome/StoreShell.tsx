/**
 * StoreShell — the storefront chrome every shop page sits in: the duotone
 * filter, cart context, age gate, announcement bar, header and footer.
 *
 * It lives here (not in the root layout) so the admin panel under /admin
 * renders without the shop's chrome. Used by app/(store)/layout.tsx and by
 * app/not-found.tsx, which renders outside the (store) group.
 */

import type { ReactNode } from "react";
import { CartProvider } from "@/lib/cart";
import { AnnouncementBar } from "@/components/chrome/AnnouncementBar";
import { Header } from "@/components/chrome/Header";
import { Footer } from "@/components/chrome/Footer";
import { AgeGate } from "@/components/chrome/AgeGate";
import { DuotoneDefs } from "@/components/plate/DuotoneDefs";

export function StoreShell({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Single duotone SVG filter (#pt-duotone) — referenced by .duotone. */}
      <DuotoneDefs />
      {/* CartProvider defaults to LocalStorageCartAdapter; pass the Woo
          adapter here when it lands — zero component changes. */}
      <CartProvider>
        {/* AgeGate overlays fully-SSR'd content — crawler-safe, no
            middleware/conditional rendering. */}
        <AgeGate />
        <div className="flex min-h-dvh flex-col">
          <AnnouncementBar />
          <Header />
          {/* Pages own their <main> landmark. */}
          <div className="flex-1">{children}</div>
          <Footer />
        </div>
      </CartProvider>
    </>
  );
}
