import type { Metadata } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";
import { requireUser } from "@/lib/admin/auth";
import { PERMISSION_INFO, ROLE_INFO, can, isPermission } from "@/lib/admin/permissions";
import { one, type SearchParams } from "@/lib/admin/params";
import { ownerNames } from "@/lib/admin/users";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "No access" };

export default async function NoAccessPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser();
  const need = one(await searchParams, "need");
  const permission = isPermission(need) ? need : null;
  const owners = ownerNames();

  return (
    <div className="soft-card mx-auto mt-6 flex max-w-lg flex-col items-center px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-secondary">
        <Lock aria-hidden="true" className="size-5 text-ink-muted" />
      </span>
      <h1 className="mt-4 text-xl font-semibold text-ink">You don&apos;t have access to this page</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Your role is <strong className="text-ink">{ROLE_INFO[user.role].label}</strong>
        {permission && (
          <>
            , which doesn&apos;t include: <strong className="text-ink">{PERMISSION_INFO[permission].label.toLowerCase()}</strong>
          </>
        )}
        .{" "}
        {owners.length > 0 && `Ask ${owners.length === 1 ? owners[0] : "an owner"} if you need it.`}
      </p>
      <Button asChild className="mt-6 h-9 px-4">
        <Link href={can(user.role, "dashboard.view") ? "/admin" : "/admin/account"}>Go back</Link>
      </Button>
    </div>
  );
}
