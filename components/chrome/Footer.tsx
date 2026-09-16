/**
 * Footer — a full-bleed green chapter band (D3): bg --green, mint text. The
 * category column is a printed dot-leader index (name ……); support + legal are
 * plain link columns; the compliance block carries the verbatim RUO + FDA
 * strings. Server component, no client JS.
 *
 * Categories come from content/taxonomy.ts (single source of truth) so the
 * footer can never drift from the catalog's own taxonomy.
 */

import Link from "next/link";
import Image from "next/image";
import { brandConfig } from "@/content/brand-config";
import { compliance } from "@/content/compliance";
import { CATEGORIES } from "@/content/taxonomy";

const SUPPORT_LINKS = [
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
  { label: "Shipping", href: "/shipping" },
  { label: "Track Order", href: "/track-order" },
] as const;

const LEGAL_LINKS = [
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
  { label: "Affiliates", href: "/affiliates" },
] as const;

const linkClass =
  "text-mint/75 transition-colors hover:text-[var(--mint-bright)]";

export function Footer() {
  return (
    <footer className="band-green">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 lg:grid-cols-[1.4fr_1fr_1fr_1.6fr]">
          {/* Shop by category — dot-leader index */}
          <div className="col-span-2 lg:col-span-1">
            <p className="micro-label-dark mb-4">Shop by Category</p>
            <ul className="flex flex-col gap-2.5">
              {CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/catalog/${cat.slug}`}
                    className={`group flex items-baseline gap-2 ${linkClass}`}
                  >
                    <span className="text-sm">{cat.name}</span>
                    <span
                      aria-hidden="true"
                      className="mb-[3px] flex-1 border-b border-dotted border-mint/25 transition-colors group-hover:border-mint/50"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <p className="micro-label-dark mb-4">Support</p>
            <ul className="flex flex-col gap-2.5">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={`text-sm ${linkClass}`}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="micro-label-dark mb-4">Legal</p>
            <ul className="flex flex-col gap-2.5">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={`text-sm ${linkClass}`}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Compliance */}
          <div className="col-span-2 lg:col-span-1">
            <p className="micro-label-dark mb-4">Compliance</p>
            <p className="text-[13px] leading-relaxed font-medium text-mint/85">
              {compliance.ruoBanner}
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-mint/60">
              {compliance.fdaDisclaimer}
            </p>
          </div>
        </div>

        {/* Bottom row — the roundel rides a white disc (/brand/logo-footer.png):
            the bare navy-on-navy logo disappears against the band, the disc
            variant reads cleanly (verified visually 2026-07-22). */}
        <div className="mt-14 flex flex-col gap-3 border-t border-mint/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/brand/logo-footer.png"
              alt=""
              aria-hidden="true"
              width={36}
              height={36}
              className="size-9"
            />
            <p className="text-[13px] text-mint/60">
              © {new Date().getFullYear()} {brandConfig.name}
            </p>
          </div>
          <p className="micro-label-dark">For Research Use Only</p>
        </div>
      </div>
    </footer>
  );
}
