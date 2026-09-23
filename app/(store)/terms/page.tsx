import type { Metadata } from "next";
import { termsPage } from "@/content/site-copy";
import { pageMetadata } from "@/components/static/page-meta";
import { PageHeader } from "@/components/static/PageHeader";
import { LegalDocument } from "@/components/static/LegalDocument";

export const metadata: Metadata = pageMetadata({
  title: termsPage.metaTitle,
  // Terms §1 — the live meta description is an auto-excerpt of the page header.
  description:
    "These Terms constitute a legally binding agreement between you and PrimeTime Peptides.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
      <PageHeader title={termsPage.title} sub={termsPage.entity} />
      <div className="mt-16">
        <LegalDocument
          sections={termsPage.sections}
          updated={termsPage.lastUpdated}
        />
      </div>
    </main>
  );
}
