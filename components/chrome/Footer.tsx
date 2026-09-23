/**
 * Footer — light ice-blue band (2026-09 CRO redesign, DESIGN.md §0): logo +
 * the brand line, "Useful Links", "Policies", and the live compliance line,
 * over a bottom rule with the copyright and accepted cards. Server component,
 * no client JS.
 *
 * Copy: live strings (footerCopy, brandConfig.hero.subhead, compliance,
 * termsPage) plus the design's labels (redesignChrome.footer). The design
 * listed Mastercard; the live checkout does not accept it.
 */

import Link from "next/link";
import Image from "next/image";
import { brandConfig } from "@/content/brand-config";
import { compliance } from "@/content/compliance";
import { bulkCopy } from "@/content/bulk";
import {
  footerCopy,
  privacyPage,
  redesignChrome,
  termsPage,
} from "@/content/site-copy";

const { links } = footerCopy;
const labels = redesignChrome.footer;

/** Same slug rule as LegalDocument's section anchors. */
function anchorId(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const refundsSection = termsPage.sections.find((s) => /refund/i.test(s.heading));

const USEFUL_LINKS = [
  { label: links.home, href: "/" },
  { label: links.catalog, href: "/catalog" },
  { label: bulkCopy.navLabel, href: "/bulk" },
  { label: links.coa, href: "/coa" },
  { label: links.faq, href: "/faq" },
  { label: links.contact, href: "/contact" },
] as const;

const POLICY_LINKS = [
  { label: labels.shipping, href: "/shipping" },
  {
    label: labels.refunds,
    href: refundsSection ? `/terms#${anchorId(refundsSection.heading)}` : "/terms",
  },
  { label: privacyPage.title, href: "/privacy" },
  { label: termsPage.title, href: "/terms" },
] as const;

const linkClass = "text-cobalt transition-colors hover:text-navy-ink";

export function Footer() {
  return (
    <footer className="border-t border-ice-rule bg-ice font-manrope leading-[normal] text-navy-ink">
      <div className="mx-auto grid max-w-[1240px] grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-8 px-6 pt-12 pb-6">
        <div>
          <Image
            src="/brand/logo-wordmark.png"
            alt={brandConfig.name}
            width={344}
            height={120}
            className="mb-3.5 h-12 w-auto"
          />
          <p className="text-[14px] leading-[1.6] text-steel-ink">
            {brandConfig.hero.subhead}
          </p>
        </div>

        <div>
          <p className="mb-3 font-extrabold">{footerCopy.linksHeading}</p>
          <ul className="grid gap-2 text-[14px]">
            {USEFUL_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 font-extrabold">{labels.policiesHeading}</p>
          <ul className="grid gap-2 text-[14px]">
            {POLICY_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[13px] leading-[1.6] font-semibold text-steel-ink italic">
          {compliance.footerNote}
        </p>
      </div>

      <div className="mx-auto flex max-w-[1240px] flex-wrap justify-between gap-2 border-t border-ice-rule px-6 pt-4 pb-7 text-[12px] text-steel">
        <span>
          © {new Date().getFullYear()} {brandConfig.name}™
        </span>
        <span>{labels.payments}</span>
      </div>
    </footer>
  );
}
