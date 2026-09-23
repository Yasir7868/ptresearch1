/**
 * lib/admin/validation.ts — input rules shared by the admin forms (client
 * hints) and the Server Actions (the enforcement). zod only; client-safe.
 */

import { z } from "zod";
import { ROLES } from "./permissions";

export const PASSWORD_MIN_LENGTH = 10;

/** A handful of passwords people reach for first; not a full breach list. */
const COMMON_PASSWORDS = new Set([
  "1234567890",
  "12345678910",
  "password123",
  "password1234",
  "qwertyuiop",
  "qwerty12345",
  "iloveyou123",
  "letmein1234",
  "welcome1234",
  "primetime123",
  "ptresearch1",
  "ptresearch123",
  "changeme123",
  "administrator",
]);

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address.").max(254, "That email address is too long."));

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Enter a name (at least 2 characters).")
  .max(80, "Keep the name under 80 characters.");

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`)
  .max(200, "Keep the password under 200 characters.")
  .refine((value) => !COMMON_PASSWORDS.has(value.toLowerCase()), {
    message: "That password is too common. Choose something less predictable.",
  })
  .refine((value) => new Set(value).size >= 4, {
    message: "That password repeats too few characters.",
  });

export const roleSchema = z.enum(ROLES, "Choose a role.");

/** New password + confirmation, with the "not your email" check. */
export function newPasswordSchema(email?: string) {
  return z
    .object({
      password: passwordSchema,
      confirm: z.string(),
    })
    .refine((v) => v.password === v.confirm, {
      message: "The passwords don't match.",
      path: ["confirm"],
    })
    .refine((v) => !email || v.password.toLowerCase() !== email.toLowerCase(), {
      message: "Don't use your email address as your password.",
      path: ["password"],
    });
}

/** First error message per field, for form display. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
