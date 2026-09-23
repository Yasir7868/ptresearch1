import type { Metadata } from "next";
import { contactInfo, headerNav } from "@/content/site-copy";
import { pageMetadata } from "@/components/static/page-meta";
import { PageHeader } from "@/components/static/PageHeader";
import { FadeIn } from "@/components/motion/FadeIn";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = pageMetadata({
  title: headerNav.contact,
  description: contactInfo.needHelpBody,
  path: "/contact",
});

// The live site has no contact page — "Contact Us" is a mailto link to the
// store address. This page carries that address with the live "Need Help?"
// wording from the product pages.
export default function ContactPage() {
  const { email } = contactInfo;

  return (
    <main className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
      <PageHeader
        label={contactInfo.needHelpHeading}
        title={headerNav.contact}
        sub={contactInfo.needHelpBody}
      />

      <FadeIn className="mt-14 max-w-xl">
        <div className="border-t border-hairline pt-6">
          <p className="micro-label">{contactInfo.emailUsLabel}</p>
          <a
            href={`mailto:${email}`}
            className="data-num mt-3 inline-block text-[clamp(1.1rem,2.2vw,1.4rem)] text-green underline decoration-hairline underline-offset-4 transition-colors hover:text-green-deep hover:decoration-green"
          >
            {email}
          </a>
          <div className="mt-8">
            <Button asChild size="lg" className="px-6">
              <a href={`mailto:${email}`}>{contactInfo.cta}</a>
            </Button>
          </div>
        </div>
      </FadeIn>
    </main>
  );
}
