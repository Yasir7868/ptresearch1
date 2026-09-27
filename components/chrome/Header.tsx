"use client";

/**
 * Header — sticky site chrome (2026-09 CRO redesign, DESIGN.md §0).
 *
 * Frosted white bar: the Primetime Research logo lockup, centred primary nav
 * (Catalog · Gift Card · Bulk Orders · COA / Lab Results · FAQ · Contact), and
 * on the right a product search (GET → /catalog?q=…, which FilterGrid reads),
 * "Track order", and the navy Cart button with its live count. Below lg the
 * nav, search and Track order move into a left sheet, and the row is lockup
 * on the left with cart + menu grouped on the right (owner request
 * 2026-09-28) — the cart shrinks to a 36px icon with the count as a badge.
 *
 * FITTING SIX NAV ITEMS ON ONE LINE. At 15px semibold the labels run 417px of
 * text (517px with gaps), and the row also carries the 126px lockup, the
 * search, Track order (110px) and Cart (90px). Two things had the nav
 * wrapping to a second line and breaking the fixed 68px bar:
 *   1. The nav and this row's right-hand group were BOTH `flex-1`, so they
 *      split the free space evenly — at 1024px that handed the right side
 *      ~130px it did not need while the nav overflowed onto the lockup.
 *      The right group is now sized to its content and the nav takes the rest.
 *   2. Nothing stopped wrapping. The nav is now `flex-nowrap` with every
 *      label `whitespace-nowrap`, so a future overflow shows up as a visible
 *      collision rather than a silently taller header.
 * The rest is bought back with 20px nav gaps, 14px labels below xl, and a
 * search field that collapses to an icon below xl (it is 264px at xl+).
 * Measured clearance either side of the nav: 43px at 1024px, 34px at 1280px
 * and up — re-measure before adding a seventh item.
 *
 * "Gift Card" sits where live puts it, after Catalog; live spells it "Digtal
 * Gift Card" and points at /digtal-gift-card/, which redirects to /gift-card.
 *
 * Cart count uses useCartOptional(): renders 0 on the server and hydrates
 * after CartProvider loads localStorage — no hydration mismatch.
 *
 * Height: 56px on phones, 68px from md (+1px rule either way). The catalog
 * filter bar pins beneath it and matches those stops (FilterGrid
 * `top-14 md:top-[68px]`), as do the #coa / #faq scroll offsets.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Form from "next/form";
import { MenuIcon, SearchIcon, ShoppingCartIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CART_DRAWER_OPEN_EVENT } from "@/components/cart/drawer-events";
import { useCartOptional } from "@/lib/cart";
import { brandConfig } from "@/content/brand-config";
import { compliance } from "@/content/compliance";
import { bulkCopy } from "@/content/bulk";
import { redesignChrome } from "@/content/site-copy";
import { cn } from "@/lib/utils";

const { nav } = redesignChrome;

const NAV_LINKS = [
  { label: nav.catalog, href: "/catalog" },
  { label: nav.giftCard, href: "/gift-card" },
  { label: bulkCopy.navLabel, href: "/bulk" },
  { label: nav.coa, href: "/coa" },
  { label: nav.faq, href: "/faq" },
  { label: nav.contact, href: "/contact" },
] as const;

const TRACK_ORDER = {
  label: redesignChrome.trackOrder,
  href: "/track-order",
} as const;

/** The logo lockup (roundel + wordmark), transparent PNG, 344x120. */
function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/logo-wordmark.png"
      alt={brandConfig.name}
      width={344}
      height={120}
      loading="eager"
      className={cn("h-9 w-auto md:h-11", className)}
    />
  );
}

/** Product search — a GET form to /catalog?q=…, read by the catalog grid. */
function SearchForm({
  className,
  onSubmit,
}: {
  className?: string;
  onSubmit?: () => void;
}) {
  return (
    <Form
      action="/catalog"
      role="search"
      onSubmit={onSubmit}
      className={cn(
        "flex h-11 min-w-0 items-center gap-2 rounded-[10px] border border-rule bg-mist px-3 transition-colors focus-within:border-cobalt",
        className
      )}
    >
      <SearchIcon aria-hidden="true" className="size-3.5 shrink-0 text-steel" />
      <input
        type="search"
        name="q"
        placeholder={redesignChrome.searchPlaceholder}
        aria-label={redesignChrome.searchLabel}
        className="w-full min-w-0 border-0 bg-transparent text-[14px] text-navy-ink outline-none placeholder:text-steel focus-visible:outline-none"
      />
    </Form>
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
    <header className="sticky top-0 z-40 border-b border-rule bg-white/92 font-manrope leading-[normal] backdrop-blur-[10px]">
      <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-3 md:h-[68px] px-4 md:px-6 lg:gap-6">
        <Link href="/" className="flex shrink-0 items-center">
          <Logo />
        </Link>

        {/* Primary nav (lg+) */}
        <nav
          aria-label="Primary"
          className="hidden min-w-0 flex-1 flex-nowrap justify-center gap-x-5 text-[14px] font-semibold text-navy-ink lg:flex xl:text-[15px]"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap text-navy-ink transition-colors hover:text-cobalt"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Search + Track order (lg+) + Cart. Sized to its content, NOT
            flex-1: an equal split handed this side ~130px it did not need
            while the nav overflowed onto the lockup. */}
        <div className="flex shrink-0 items-center justify-end gap-2 max-lg:flex-1">
          <SearchForm className="hidden w-[264px] xl:flex" />
          {/* lg → xl: the field would squeeze the nav, so it collapses. */}
          <Link
            href="/catalog"
            aria-label={redesignChrome.searchLabel}
            className="hidden size-11 shrink-0 items-center justify-center rounded-[10px] border border-rule text-navy transition-colors hover:border-cobalt lg:inline-flex xl:hidden"
          >
            <SearchIcon aria-hidden="true" className="size-4" />
          </Link>
          <Link
            href={TRACK_ORDER.href}
            className="hidden h-11 items-center rounded-[10px] border border-rule px-4 text-[14px] font-bold whitespace-nowrap text-navy transition-colors hover:border-cobalt lg:inline-flex"
          >
            {TRACK_ORDER.label}
          </Link>
          {/* Cart: a compact icon below lg (phones read the glyph fine and
              the row is tight), the design's "Cart n" button from lg. The
              count rides the icon as a badge and sits inline in the button;
              both are aria-hidden — the label carries the number. */}
          <button
            type="button"
            className="relative flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-[10px] bg-navy text-[14px] font-bold text-white transition-colors hover:bg-cobalt lg:size-auto lg:h-11 lg:gap-2 lg:px-4"
            aria-label={`Open cart, ${count} ${count === 1 ? "item" : "items"}`}
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCartIcon aria-hidden="true" className="size-[18px] lg:hidden" />
            <span className="hidden lg:inline">{redesignChrome.cart}</span>
            {count > 0 ? (
              <span
                aria-hidden="true"
                className="absolute -top-1 -right-1 inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-cobalt px-1 text-[10px] leading-none text-white ring-2 ring-white tabular-nums lg:hidden"
              >
                {count > 99 ? "99+" : count}
              </span>
            ) : null}
            <span
              aria-hidden="true"
              className="hidden h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[12px] text-navy tabular-nums lg:inline-flex"
            >
              {count > 99 ? "99+" : count}
            </span>
          </button>

          {/* Menu — last, so the tap targets sit together on the right. */}
          <button
            type="button"
            className="-mr-1.5 inline-flex size-10 shrink-0 items-center justify-center rounded-[10px] text-navy-ink transition-colors hover:bg-mist lg:hidden"
            aria-label={redesignChrome.menu}
            onClick={() => setMenuOpen(true)}
          >
            <MenuIcon className="size-5" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="left"
          className="flex flex-col rounded-r-2xl bg-white font-manrope"
        >
          <SheetHeader className="border-b border-rule">
            <SheetTitle className="sr-only">{brandConfig.name}</SheetTitle>
            <Logo className="h-10 self-start" />
            <SheetDescription className="pt-1 text-[11px] font-bold tracking-[0.18em] text-steel uppercase">
              {compliance.ruoStrip}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4">
            <SearchForm onSubmit={() => setMenuOpen(false)} />
          </div>
          <nav aria-label="Mobile" className="flex flex-col px-4">
            {[...NAV_LINKS, TRACK_ORDER].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="border-b border-rule py-3.5 text-[15px] font-semibold text-navy-ink transition-colors hover:text-cobalt"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Cart drawer */}
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </header>
  );
}
