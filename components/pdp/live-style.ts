/**
 * components/pdp/live-style.ts — shared measurements of the live
 * ptresearch.shop single-product template (Elementor template 3224), which the
 * product page copies (DESIGN.md §0). Like the /coa copy, these are the live
 * page's own colors and sizes, not the D3 or redesign tokens.
 */

/** The live page's body font stack (the WordPress theme default). */
export const LIVE_FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif';

/** The soft grey panel the live template uses for every card. */
export const PANEL = "rounded-[18px] border border-[#d6d7e3] bg-[#f8f8f9]";

/** PANEL plus the template's faint drop shadow (the outer column cards). */
export const PANEL_RAISED = `${PANEL} shadow-[0_16px_38px_rgba(38,54,111,0.05)]`;

/** Navy dosage pill (every pill looks the same live; see BuyPanel). */
export const PILL =
  "cursor-pointer rounded-full border border-[#14214d] bg-[#14214d] font-semibold text-white shadow-[0_6px_16px_rgba(41,46,76,0.28)] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14214d]";

/** Navy pill button (Add to cart). */
export const NAVY_BUTTON =
  "inline-flex cursor-pointer items-center justify-center rounded-full bg-[#14214d] font-bold text-white transition-colors hover:bg-[#1f2f66] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14214d]";
