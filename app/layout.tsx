import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { defaultMetadata } from "@/lib/seo";
import { brandConfig } from "@/content/brand-config";

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

/* Manrope Variable (SIL OFL, latin subset, wght 500–800) — the face of the
   2026-09 CRO redesign: the site chrome on every page plus the homepage
   (DESIGN.md §0). Exposes --font-manrope-face, consumed by the `font-manrope`
   utility. The redesign's serif (Source Serif 4) loads on the homepage only. */
const manrope = localFont({
  src: "./fonts/Manrope-Variable-latin.woff2",
  weight: "500 800",
  style: "normal",
  variable: "--font-manrope-face",
  display: "swap",
  preload: true,
  fallback: ["Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
});

export const metadata: Metadata = defaultMetadata;

export const viewport: Viewport = {
  themeColor: brandConfig.palette.paper,
};

/* The root layout is shared by the storefront and the admin panel, so it
   carries only the document, font and global styles. The shop chrome (cart,
   age gate, header, footer) is StoreShell in app/(store)/layout.tsx; the
   admin chrome is app/admin/(panel)/layout.tsx. */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${satoshi.variable} ${manrope.variable} font-sans`}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
