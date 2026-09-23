import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Admin · Primetime Research",
    template: "%s · Admin · Primetime Research",
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
  openGraph: null,
  twitter: null,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
