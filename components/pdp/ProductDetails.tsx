/**
 * ProductDetails — the live product template's second card: "Description"
 * (the WooCommerce short description, bold runs kept), then "Usage" and "FAQ"
 * from the long description as bulleted cards (the FAQ is a plain list, not an
 * accordion, as live), then the research-use disclaimer. Server Component;
 * every string is the product's own store copy or content/site-copy.ts.
 */

import type { FaqItem, RichParagraph } from "@/lib/woo/types";
import { productPage } from "@/content/site-copy";
import { cn } from "@/lib/utils";
import { PANEL, PANEL_RAISED } from "./live-style";

const BODY = "text-sm leading-[1.72] text-[#37405d]";

function ExtraSection({
  id,
  heading,
  children,
}: {
  id: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className={cn(PANEL_RAISED, "p-5")}>
      <h2
        id={id}
        className="mb-2.5 text-2xl leading-[1.2] font-medium tracking-[-0.02em] text-[#292e4c]"
      >
        {heading}
      </h2>
      <ul className={cn(BODY, "list-disc pl-10")}>{children}</ul>
    </section>
  );
}

export function ProductDetails({
  summary,
  usage,
  faq,
}: {
  summary: RichParagraph[];
  usage: string[];
  faq: FaqItem[];
}) {
  const faqItems = faq.filter((item) => item.q || item.a);

  return (
    <div className={cn(PANEL_RAISED, "flex flex-col gap-[15px] p-2.5")}>
      {summary.length > 0 ? (
        <section aria-labelledby="pdp-description" className={cn(PANEL, "flex flex-col gap-5 p-5")}>
          <h2
            id="pdp-description"
            className="font-roboto text-2xl leading-none font-medium text-[#292e4c]"
          >
            {productPage.descriptionHeading}
          </h2>
          <div className={BODY}>
            {summary.map((runs, i) => (
              <p key={i}>
                {runs.map((run, j) =>
                  run.strong ? <strong key={j}>{run.text}</strong> : run.text
                )}
              </p>
            ))}
          </div>
        </section>
      ) : null}

      {usage.length > 0 || faqItems.length > 0 ? (
        <div className="flex flex-col gap-3">
          {usage.length > 0 ? (
            <ExtraSection id="pdp-usage" heading={productPage.usageHeading}>
              {usage.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ExtraSection>
          ) : null}
          {faqItems.length > 0 ? (
            <ExtraSection id="pdp-faq" heading={productPage.faqHeading}>
              {faqItems.map((item, i) => (
                <li key={i}>
                  {item.q ? <strong>{item.q}</strong> : null}
                  {item.q && item.a ? " " : null}
                  {item.a}
                </li>
              ))}
            </ExtraSection>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-[18px] border border-[#d8dbe8] bg-[#f8f8fa] px-[18px] py-4 md:rounded-[22px] md:px-[22px] md:py-[18px]">
        <p className="text-[15px] leading-[1.6] text-[#243b72] md:text-base">
          <strong>{productPage.disclaimerLabel}</strong> {productPage.disclaimerLead}{" "}
          <strong>{productPage.disclaimerEmphasis}</strong>
          {productPage.disclaimerEnd}
        </p>
      </div>
    </div>
  );
}
