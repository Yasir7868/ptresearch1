import type { Metadata } from "next";
import Link from "next/link";
import { faqItems, contactInfo, type FaqItem } from "@/content/site-copy";
import { pageMetadata } from "@/components/static/page-meta";
import { PageHeader } from "@/components/static/PageHeader";
import { FadeIn } from "@/components/motion/FadeIn";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = pageMetadata({
  title: "FAQ",
  description:
    "Answers on peptide purity, third-party testing, cold-chain shipping, storage, returns, and order tracking for Primetime Research.",
  path: "/faq",
});

// The 9-item /faq set is canonical (DESIGN §7.11) — detailed, method-specific.
// Group the verbatim items into natural sections. Any item not matched below
// is appended to a final group so nothing is ever dropped.
const GROUP_DEFS: { label: string; questions: string[] }[] = [
  {
    label: "Products & Quality",
    questions: [
      "What are peptides?",
      "Who can purchase from Primetime Peptides?",
      "What purity levels do you guarantee?",
      "Are your peptides third-party tested?",
    ],
  },
  {
    label: "Shipping & Storage",
    questions: [
      "How do you ship temperature-sensitive peptides?",
      "How should I store my peptides?",
      "How long does shipping take?",
    ],
  },
  {
    label: "Orders & Returns",
    questions: ["What is your return policy?", "How can I track my order?"],
  },
];

function buildGroups(): { label: string; items: FaqItem[] }[] {
  const used = new Set<string>();
  const groups = GROUP_DEFS.map((def) => {
    const items = def.questions
      .map((q) => faqItems.find((f) => f.q === q))
      .filter((f): f is FaqItem => Boolean(f));
    items.forEach((f) => used.add(f.q));
    return { label: def.label, items };
  });

  const leftover = faqItems.filter((f) => !used.has(f.q));
  if (leftover.length > 0) {
    groups.push({ label: "More Questions", items: leftover });
  }
  return groups.filter((g) => g.items.length > 0);
}

function slugifyQuestion(q: string): string {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function FaqPage() {
  const groups = buildGroups();

  return (
    <main className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
      <PageHeader
        label="Support"
        title="Frequently Asked Questions"
        sub="Purity, testing, shipping, storage, and orders — the details researchers ask about most."
      />

      <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] lg:gap-20">
        {/* Section index — dot-leader treatment (sticky on desktop) */}
        <FadeIn>
          <nav aria-label="FAQ sections" className="lg:sticky lg:top-24">
            <p className="micro-label mb-4">On this page</p>
            <ul className="flex flex-col">
              {groups.map((group) => (
                <li key={group.label} className="hairline-t">
                  <a
                    href={`#${slugifyQuestion(group.label)}`}
                    className="group flex items-baseline gap-2 py-3"
                  >
                    <span className="text-sm text-ink-muted transition-colors group-hover:text-ink">
                      {group.label}
                    </span>
                    <span
                      aria-hidden="true"
                      className="mb-[4px] min-w-4 flex-1 border-b border-dotted border-hairline transition-colors group-hover:border-ink-muted"
                    />
                    <span className="data-num text-[12px] text-ink-muted">
                      {group.items.length}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </FadeIn>

        {/* Grouped accordions — record cards */}
        <div className="flex flex-col gap-16">
          {groups.map((group) => (
            <FadeIn key={group.label}>
              <section
                id={slugifyQuestion(group.label)}
                className="scroll-mt-28"
              >
                <h2 className="font-display text-[1.5rem] tracking-[-0.025em] text-ink">
                  {group.label}
                </h2>
                <Accordion
                  type="single"
                  collapsible
                  className="soft-card mt-4 w-full overflow-hidden px-5 md:px-6"
                >
                  {group.items.map((item) => {
                    const id = slugifyQuestion(item.q);
                    return (
                      <AccordionItem
                        key={id}
                        value={id}
                        className="border-hairline/60"
                      >
                        <AccordionTrigger className="py-4 font-display text-[16.5px] leading-snug font-semibold tracking-[-0.01em] text-ink hover:text-green hover:no-underline">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="flex flex-col gap-3 pr-4 pb-2 text-[14.5px] leading-relaxed text-ink-muted">
                            {item.a
                              .split(/\n\s*\n/)
                              .map((para) => para.trim())
                              .filter(Boolean)
                              .map((para, i) => (
                                <p key={i}>{para}</p>
                              ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </section>
            </FadeIn>
          ))}

          {/* Contact CTA — a soft record card */}
          <FadeIn>
            <div className="plate">
              <div className="plate-field flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between md:p-8">
                <div>
                  <p className="font-display text-[1.25rem] font-semibold tracking-[-0.02em] text-ink">
                    Still have a question?
                  </p>
                  <p className="mt-1.5 max-w-md text-sm leading-relaxed text-ink-muted">
                    Our team handles product inquiries, COA requests, and order
                    status. {contactInfo.responsePromise}
                  </p>
                </div>
                <Button asChild size="lg" className="shrink-0 self-start px-5 sm:self-center">
                  <Link href="/contact">Contact support</Link>
                </Button>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </main>
  );
}
