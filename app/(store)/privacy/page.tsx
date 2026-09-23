import type { Metadata } from "next";
import { privacyPage } from "@/content/site-copy";
import { pageMetadata } from "@/components/static/page-meta";
import { PageHeader } from "@/components/static/PageHeader";
import { LegalDocument } from "@/components/static/LegalDocument";

export const metadata: Metadata = pageMetadata({
  title: privacyPage.metaTitle,
  // Privacy §1 — the live meta description is an auto-excerpt of the page header.
  description:
    'PrimeTime Peptides ("PrimeTime Peptides," "Company," "we," "us," or "our") is committed to protecting your privacy and safeguarding your personal information.',
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
      <PageHeader title={privacyPage.title} sub={privacyPage.entity} />
      <div className="mt-16">
        <LegalDocument
          sections={privacyPage.sections}
          updated={privacyPage.lastUpdated}
        />
      </div>
    </main>
  );
}
