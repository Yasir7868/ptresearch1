import type { Metadata } from "next";
import { termsHtmlSections } from "@/content/site-copy";
import { pageMetadata } from "@/components/static/page-meta";
import { PageHeader } from "@/components/static/PageHeader";
import { LegalDocument } from "@/components/static/LegalDocument";

export const metadata: Metadata = pageMetadata({
  title: "Terms & Conditions",
  description:
    "Terms and conditions for Primetime Research — research-use-only acknowledgment, eligibility, order processing, returns, and dispute resolution.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
      <PageHeader
        label="Legal"
        title="Terms & Conditions"
        sub="The agreement governing purchases from Primetime Research. Please read before ordering."
      />
      <div className="mt-16">
        <LegalDocument sections={termsHtmlSections} />
      </div>
    </main>
  );
}
