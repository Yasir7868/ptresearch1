import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/admin/auth";
import { ROLE_INFO } from "@/lib/admin/permissions";
import { adminReadiness } from "@/lib/admin/readiness";
import { peekToken } from "@/lib/admin/users";
import { AuthCard, ConfigProblem } from "@/components/admin/auth/AuthCard";
import { AcceptInviteForm } from "@/components/admin/auth/AuthForms";

export const metadata: Metadata = { title: "Accept invite" };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const readiness = await adminReadiness();
  if (!readiness.ok) return <ConfigProblem message={readiness.message} />;

  const { token } = await params;
  const invite = peekToken(token, "invite");
  if (!invite) {
    return (
      <AuthCard
        title="This invite link doesn't work anymore"
        description="Invite links work once and expire after 72 hours. Ask the person who invited you to send a new one."
        footer={
          <Link href="/admin/login" className="font-medium text-green underline-offset-4 hover:underline">
            Go to sign in
          </Link>
        }
      />
    );
  }

  const current = await getCurrentUser();
  const role = ROLE_INFO[invite.user.role];

  return (
    <AuthCard
      title="You're invited"
      description={
        <>
          <p>
            You&apos;ve been given <strong className="text-ink">{role.label}</strong> access to the Primetime Research
            admin panel. {role.summary}
          </p>
          {current && current.id !== invite.user.id && (
            <p className="mt-2">You&apos;re currently signed in as {current.email}; accepting will switch to the new account.</p>
          )}
        </>
      }
    >
      <AcceptInviteForm token={token} name={invite.user.name} email={invite.user.email} />
    </AuthCard>
  );
}
