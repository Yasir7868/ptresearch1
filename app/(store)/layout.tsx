import { StoreShell } from "@/components/chrome/StoreShell";

/** Every storefront route renders inside the shop chrome. */
export default function StoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <StoreShell>{children}</StoreShell>;
}
