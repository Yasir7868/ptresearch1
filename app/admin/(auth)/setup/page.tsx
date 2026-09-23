import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { setupToken, SETUP_TOKEN_MIN_LENGTH } from "@/lib/admin/config";
import { adminReadiness } from "@/lib/admin/readiness";
import { AuthCard, ConfigProblem } from "@/components/admin/auth/AuthCard";
import { SetupForm } from "@/components/admin/auth/AuthForms";

export const metadata: Metadata = { title: "Set up" };

export default async function SetupPage() {
  const readiness = await adminReadiness();
  if (!readiness.ok) return <ConfigProblem message={readiness.message} />;
  if (readiness.users > 0) redirect("/admin/login");

  if (!setupToken()) {
    return (
      <AuthCard
        title="Set up the admin panel"
        description={
          <>
            <p>
              To create the first owner account, set an <strong className="text-ink">ADMIN_SETUP_TOKEN</strong>{" "}
              environment variable (any random string of at least {SETUP_TOKEN_MIN_LENGTH} characters) and restart
              the app. You&apos;ll enter it on this page once.
            </p>
            <p className="mt-3">
              One way to generate one: <code className="rounded bg-secondary px-1.5 py-0.5 text-[13px] text-ink">openssl rand -hex 24</code>
            </p>
          </>
        }
        footer="The token stops anyone else from claiming the panel on a fresh deployment. You can remove it after setup."
      />
    );
  }

  return (
    <AuthCard
      title="Create the owner account"
      description="This is the first account. Owners can invite everyone else and decide what each person can do."
    >
      <SetupForm />
    </AuthCard>
  );
}
