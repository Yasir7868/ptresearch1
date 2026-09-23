import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/admin/auth";
import { adminReadiness } from "@/lib/admin/readiness";
import { AuthCard, ConfigProblem } from "@/components/admin/auth/AuthCard";
import { SignInForm } from "@/components/admin/auth/AuthForms";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const readiness = await adminReadiness();
  if (!readiness.ok) return <ConfigProblem message={readiness.message} />;
  if (readiness.users === 0) redirect("/admin/setup");

  const raw = (await searchParams).next;
  const next = typeof raw === "string" && raw.startsWith("/admin") ? raw : "/admin";
  if (await getCurrentUser()) redirect(next.startsWith("/admin/login") ? "/admin" : next);

  return (
    <AuthCard
      title="Sign in"
      description="Orders, stock and customers for the Primetime Research store."
      footer="Forgot your password? Ask an owner to send you a reset link from the Team page."
    >
      <SignInForm next={next} />
    </AuthCard>
  );
}
