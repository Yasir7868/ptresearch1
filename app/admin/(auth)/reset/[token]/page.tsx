import type { Metadata } from "next";
import Link from "next/link";
import { adminReadiness } from "@/lib/admin/readiness";
import { peekToken } from "@/lib/admin/users";
import { AuthCard, ConfigProblem } from "@/components/admin/auth/AuthCard";
import { ResetPasswordForm } from "@/components/admin/auth/AuthForms";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const readiness = await adminReadiness();
  if (!readiness.ok) return <ConfigProblem message={readiness.message} />;

  const { token } = await params;
  const reset = peekToken(token, "reset");
  if (!reset) {
    return (
      <AuthCard
        title="This reset link doesn't work anymore"
        description="Reset links work once and expire after 24 hours. Ask an owner to create a new one."
        footer={
          <Link href="/admin/login" className="font-medium text-green underline-offset-4 hover:underline">
            Go to sign in
          </Link>
        }
      />
    );
  }

  return (
    <AuthCard
      title="Choose a new password"
      description={
        <p>
          For <strong className="text-ink">{reset.user.email}</strong>. You&apos;ll be signed out everywhere else.
        </p>
      }
    >
      <ResetPasswordForm token={token} email={reset.user.email} />
    </AuthCard>
  );
}
