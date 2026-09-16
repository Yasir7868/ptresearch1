import type { Metadata } from "next";
import { privacySections } from "@/content/site-copy";
import { pageMetadata } from "@/components/static/page-meta";
import { PageHeader } from "@/components/static/PageHeader";
import { LegalDocument } from "@/components/static/LegalDocument";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "How Primetime Research collects, uses, shares, retains, and protects your personal information, and the privacy rights available to you.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
      <PageHeader
        label="Legal"
        title="Privacy Policy"
        sub="How we collect, use, and protect your information."
      />
      <div className="mt-16">
        <LegalDocument sections={privacySections} />
      </div>
    </main>
  );
}
