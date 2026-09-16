import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import { defaultMetadata } from "@/lib/seo";
import { brandConfig } from "@/content/brand-config";
import { AnnouncementBar } from "@/components/chrome/AnnouncementBar";
import { Header } from "@/components/chrome/Header";
import { Footer } from "@/components/chrome/Footer";
import { AgeGate } from "@/components/chrome/AgeGate";
import { DuotoneDefs } from "@/components/plate/DuotoneDefs";

/* Font — ONE self-hosted variable face across the entire site (owner
   directive, Matt 2026-07: "more normal and clean"): Satoshi Variable
   (Indian Type Foundry via Fontshare, ITF Free Font License), wght 300–900
   + italic, in app/fonts/. Display, body, UI, and data are ALL Satoshi —
   Fraunces + General Sans are RETIRED (their .woff2 files remain on disk,
   unwired). display:swap, preloaded. Exposes --font-satoshi, consumed by
   @theme in globals.css (every legacy font var aliases to it there).
   Do NOT add next/font/google here. */
const satoshi = localFont({
  src: [
    {
      path: "./fonts/Satoshi-Variable.woff2",
      weight: "300 900",
      style: "normal",
    },
    {
      path: "./fonts/Satoshi-VariableItalic.woff2",
      weight: "300 900",
      style: "italic",
    },
  ],
  variable: "--font-satoshi",
  display: "swap",
  preload: true,
  fallback: [
    "ui-sans-serif",
    "system-ui",
    "-apple-system",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
});

export const metadata: Metadata = defaultMetadata;

export const viewport: Viewport = {
  themeColor: brandConfig.palette.paper,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${satoshi.variable} font-sans`}
    >
      <body className="antialiased">
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
      </body>
    </html>
  );
}
