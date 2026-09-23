/**
 * NeedHelpBand — the live product template's full-width navy "Need Help?"
 * band: heading and line on the left, a white "Contact Us" button (mailto)
 * on the right; stacked on phones with the button kept to the right.
 */

import { contactInfo } from "@/content/site-copy";

export function NeedHelpBand() {
  return (
    <section
      aria-labelledby="pdp-need-help"
      className="bg-[linear-gradient(135deg,#14214d_0%,#1a2a5e_100%)] px-6 py-8"
    >
      <div className="mx-auto grid max-w-[1140px] items-center gap-5 px-2.5 md:grid-cols-2 md:px-0">
        <div className="font-roboto">
          <h2 id="pdp-need-help" className="text-[22px] leading-none font-bold text-white">
            {contactInfo.needHelpHeading}
          </h2>
          <p className="mt-1.5 text-[13px] leading-normal font-medium text-white/70">
            {contactInfo.needHelpBody}
          </p>
        </div>
        <a
          href={`mailto:${contactInfo.email}`}
          className="justify-self-end rounded-xl bg-white px-8 py-3 font-roboto text-[13px] leading-none font-bold text-[#14214d] transition-colors hover:bg-[#eef1f8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {contactInfo.cta}
        </a>
      </div>
    </section>
  );
}
