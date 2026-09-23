import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { History } from "lucide-react";
import { activityPeople, listActivity, type ActivityTargetType } from "@/lib/admin/activity";
import { requirePermission } from "@/lib/admin/auth";
import { one, oneOf, pageParam, type SearchParams } from "@/lib/admin/params";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/admin/Feedback";
import { LocalTime } from "@/components/admin/LocalTime";
import { PageHeader } from "@/components/admin/PageHeader";
import { Pagination } from "@/components/admin/Pagination";

export const metadata: Metadata = { title: "Activity" };

const PER_PAGE = 50;

const TYPES: { value: "" | ActivityTargetType; label: string }[] = [
  { value: "", label: "Everything" },
  { value: "order", label: "Orders" },
  { value: "product", label: "Stock" },
  { value: "user", label: "Team" },
  { value: "account", label: "Sign-ins" },
  { value: "store", label: "Exports and settings" },
];

const selectClass =
  "h-9 rounded-lg border border-input bg-surface px-2.5 text-sm text-ink outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function targetLink(type: string | null, id: string | null): string | null {
  if (type === "order" && id && /^\d+$/.test(id)) return `/admin/orders/${id}`;
  return null;
}

export default async function ActivityPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requirePermission("activity.view");
  const sp = await searchParams;
  const people = activityPeople();
  const userId = one(sp, "user");
  const person = people.find((p) => p.id === userId);
  const type = oneOf(sp, "type", TYPES.map((t) => t.value), "");
  const page = pageParam(sp);

  const { entries, total } = listActivity({
    userId: person?.id,
    targetType: type || undefined,
    page,
    perPage: PER_PAGE,
  });

  return (
    <>
      <PageHeader
        title="Activity"
        description="Everything done in this admin panel, newest first. Changes to orders also appear in the order notes in WooCommerce."
      />

      <div className="soft-card overflow-hidden">
        <Form action="/admin/activity" replace scroll={false} className="flex flex-wrap items-center gap-2 border-b border-hairline/70 px-4 py-3 md:px-5">
          <select name="user" defaultValue={person?.id ?? ""} aria-label="Person" className={selectClass}>
            <option value="">Everyone</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select name="type" defaultValue={type} aria-label="Kind of activity" className={selectClass}>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <Button type="submit" variant="outline" className="h-9 px-3">
            Filter
          </Button>
        </Form>

        {entries.length === 0 ? (
          <EmptyState icon={History} title="No activity yet">
            Sign-ins, order changes, stock updates and team changes show up here.
          </EmptyState>
        ) : (
          <>
            <ol className="divide-y divide-hairline/70">
              {entries.map((entry) => {
                const href = targetLink(entry.targetType, entry.targetId);
                return (
                  <li key={entry.id} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-baseline sm:gap-4">
                    <LocalTime value={entry.createdAt} format="datetime" className="shrink-0 text-[13px] text-ink-muted sm:w-44" />
                    <p className="min-w-0 flex-1 text-sm text-ink">
                      <span className="font-medium">{entry.userName ?? "System"}</span>{" "}
                      <span className="text-ink-muted">·</span>{" "}
                      {href ? (
                        <Link href={href} className="underline-offset-4 hover:text-green hover:underline">
                          {entry.summary}
                        </Link>
                      ) : (
                        entry.summary
                      )}
                    </p>
                    {entry.ip && <span className="data-num shrink-0 text-[12px] text-ink-muted">{entry.ip}</span>}
                  </li>
                );
              })}
            </ol>
            <Pagination
              path="/admin/activity"
              params={{ user: person?.id, type: type || undefined }}
              page={page}
              perPage={PER_PAGE}
              total={total}
              totalPages={Math.ceil(total / PER_PAGE)}
              noun="entries"
            />
          </>
        )}
      </div>
    </>
  );
}
