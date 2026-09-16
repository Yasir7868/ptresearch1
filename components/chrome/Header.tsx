"use client";

/**
 * Header — sticky site chrome.
 *
 * Brand roundel (client's Celtic-knot logo, /brand/logo.png) beside the
 * typographic wordmark (the roundel carries no legible wordmark of its own at
 * header size), primary nav, search (→ /catalog), cart button with live count
 * badge (opens CartDrawer), and a left-sheet mobile menu.
 *
 * Cart count uses useCartOptional(): renders 0 items on the server and
 * hydrates after CartProvider loads localStorage — no hydration mismatch,
 * badge simply appears with the count.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MenuIcon, SearchIcon, ShoppingCartIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CART_DRAWER_OPEN_EVENT } from "@/components/cart/drawer-events";
import { useCartOptional } from "@/lib/cart";
import { compliance } from "@/content/compliance";

const NAV_LINKS = [
  { label: "Catalog", href: "/catalog" },
  { label: "Lab Results", href: "/coa" },
  { label: "FAQ", href: "/faq" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <Image
        src="/brand/logo.png"
        alt=""
        aria-hidden="true"
        width={34}
        height={34}
        priority
        className="size-[34px] shrink-0"
      />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[19px] leading-none font-bold tracking-[-0.02em] text-ink">
          Primetime Research
        </span>
        <span className="micro-label mt-1.5 !text-[9.5px]">
          Reference-Grade Peptides
        </span>
      </span>
    </Link>
  );
}

export function Header() {
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const cart = useCartOptional();
  const count = cart?.count ?? 0;

  // Add-to-cart actions elsewhere (PDP BuyPanel) ask the drawer to open.
  useEffect(() => {
    const open = () => setCartOpen(true);
    window.addEventListener(CART_DRAWER_OPEN_EVENT, open);
    return () => window.removeEventListener(CART_DRAWER_OPEN_EVENT, open);
  }, []);

  return (
    <header className="hairline-b sticky top-0 z-40 bg-bg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 md:px-6">
        {/* Left: mobile menu + wordmark */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <MenuIcon />
          </Button>
          <Wordmark />
        </div>

        {/* Center: primary nav (md+) */}
        <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-muted transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right: search + cart */}
        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="icon" aria-label="Search the catalog">
            <Link href="/catalog">
              <SearchIcon />
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={`Open cart, ${count} ${count === 1 ? "item" : "items"}`}
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCartIcon />
            {count > 0 && (
              <span
                aria-hidden="true"
                className="data-mono absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-accent text-[9px] leading-none text-white"
              >
                {count > 99 ? "99" : count}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="flex flex-col rounded-r-2xl bg-bg">
          <SheetHeader className="hairline-b">
            <Image
              src="/brand/logo.png"
              alt=""
              aria-hidden="true"
              width={36}
              height={36}
              className="size-9"
            />
            <SheetTitle className="font-display text-[20px] font-bold tracking-[-0.02em] text-ink">
              Primetime Research
            </SheetTitle>
            <SheetDescription className="micro-label pt-1">
              Reference-Grade Peptides
            </SheetDescription>
          </SheetHeader>
          <nav aria-label="Mobile" className="flex flex-col px-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hairline-b py-3.5 text-[15px] font-medium text-ink transition-colors hover:text-accent"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <p className="micro-label mt-auto px-4 pb-6">
            {compliance.ruoBanner}
          </p>
        </SheetContent>
      </Sheet>

      {/* Cart drawer */}
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </header>
  );
}
