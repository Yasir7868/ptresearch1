import type { Metadata } from "next";
import { contactInfo } from "@/content/site-copy";
import { pageMetadata } from "@/components/static/page-meta";
import { PageHeader } from "@/components/static/PageHeader";
import { ContactForm } from "@/components/static/ContactForm";
import { FadeIn } from "@/components/motion/FadeIn";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description:
    "Reach Primetime Research support for product inquiries, COA requests, order status, and bulk orders. We typically respond within 24 hours on business days.",
  path: "/contact",
});

const SUPPORT_TOPICS = [
  "Product inquiries",
  "COA and purity requests",
  "Order status and tracking",
  "Bulk and wholesale orders",
];

export default function ContactPage() {
  const email = contactInfo.supportEmail;

  return (
    <main className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
      <PageHeader
        label="Support"
        title="Contact"
        sub="Questions about a compound, a certificate, or an order? Send us a note."
      />

      <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-20">
        {/* Left: the support record */}
        <FadeIn>
          <div className="flex flex-col gap-10">
            <div className="border-t border-hairline pt-5">
              <p className="micro-label">Email</p>
              <a
                href={`mailto:${email}`}
                className="data-num mt-2.5 inline-block text-[15px] text-green underline decoration-hairline underline-offset-4 transition-colors hover:text-green-deep hover:decoration-green"
              >
                {email}
              </a>
              <p className="mt-2.5 text-[13px] leading-relaxed text-ink-muted">
                {contactInfo.responsePromise}
              </p>
            </div>

            <div>
              <p className="micro-label">What we help with</p>
              <ul className="mt-3 flex flex-col">
                {SUPPORT_TOPICS.map((topic) => (
                  <li
                    key={topic}
                    className="hairline-t flex items-center gap-3 py-3.5 text-sm text-ink"
                  >
                    <span
                      aria-hidden="true"
                      className="h-px w-3 shrink-0 bg-green"
                    />
                    {topic}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </FadeIn>

        {/* Right: the framed form */}
        <FadeIn>
          <ContactForm supportEmail={email} />
        </FadeIn>
      </div>
    </main>
  );
}
