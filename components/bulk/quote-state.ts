/**
 * Shared shape for the bulk quote form's action state.
 *
 * It lives here rather than beside the action because a "use server" module
 * may only export async functions — every other export is rewritten into a
 * server reference, so a plain object imported from it arrives on the client
 * as a callable stub instead of the initial state `useActionState` expects.
 */

export interface QuoteState {
  ok: boolean;
  /** Field name -> first error message. Empty when the submit succeeded. */
  errors: Record<string, string>;
  /** Set on an unexpected failure (network, non-2xx webhook). */
  formError?: string;
}

export const emptyQuoteState: QuoteState = { ok: false, errors: {} };
