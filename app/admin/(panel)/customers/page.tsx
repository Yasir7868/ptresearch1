import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Search, Users } from "lucide-react";
import { requirePermission } from "@/lib/admin/auth";
import { formatCount, formatMoney } from "@/lib/admin/money";
import { oneOf, pageParam, searchParam, type SearchParams } from "@/lib/admin/params";
import { can } from "@/lib/admin/permissions";
import { isWooConfigured, settle } from "@/lib/admin/woo/client";
import { listCustomers, type CustomerSort, type CustomerType } from "@/lib/admin/woo/customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, ProblemPanel } from "@/components/admin/Feedback";
import { LocalTime } from "@/components/admin/LocalTime";
import { NotConnected } from "@/components/admin/NotConnected";
import { PageHeader } from "@/components/admin/PageHeader";
import { Pagination } from "@/components/admin/Pagination";
import { Pill } from "@/components/admin/StatusBadge";

export const metadata: Metadata = { title: "Customers" };

const TYPES: { value: CustomerType; label: string }[] = [
  { value: "all", label: "All customers" },
  { value: "registered", label: "With an account" },
  { value: "guest", label: "Guest checkouts" },
];

const SORTS: { value: CustomerSort; label: string }[] = [
  { value: "date_last_active", label: "Most recently active" },
  { value: "total_spend", label: "Highest total spend" },
  { value: "orders_count", label: "Most orders" },
  { value: "name", label: "Name" },
];

const PER_PAGE = 25;

const selectClass =
  "h-9 rounded-lg border border-input bg-surface px-2.5 text-sm text-ink outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requirePermission("customers.view");
  const canFix = can(user.role, "settings.manage");

  if (!isWooConfigured()) {
    return (
      <>
        <PageHeader title="Customers" />
        <NotConnected canFix={canFix} />
      </>
    );
  }

  const sp = await searchParams;
  const q = searchParam(sp);
  const type = oneOf(sp, "type", TYPES.map((t) => t.value), "all");
  const sort = oneOf(sp, "sort", SORTS.map((s) => s.value), "date_last_active");
  const page = pageParam(sp);
  const params = {
    q: q || undefined,
    type: type === "all" ? undefined : type,
    sort: sort === "date_last_active" ? undefined : sort,
  };

  const list = await settle(listCustomers({ search: q || undefined, type, sort, page, perPage: PER_PAGE }));

  return (
    <>
      <PageHeader
        title="Customers"
        description="Everyone who has ordered, including guest checkouts, with their order count and spend (WooCommerce Analytics)."
      />

      <div className="soft-card overflow-hidden">
        <Form action="/admin/customers" replace scroll={false} className="flex flex-wrap items-center gap-2 border-b border-hairline/70 px-4 py-3 md:px-5">
          <div className="relative min-w-[220px] flex-1 md:max-w-sm">
            <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink-muted" />
            <Input name="q" type="search" defaultValue={q} placeholder="Name, username or email" aria-label="Search customers" className="h-9 bg-surface pl-8" />
          </div>
          <select name="type" defaultValue={type} aria-label="Customer type" className={selectClass}>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <select name="sort" defaultValue={sort} aria-label="Sort by" className={selectClass}>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <Button type="submit" variant="outline" className="h-9 px-3">
            Apply
          </Button>
        </Form>

        {!list.ok ? (
          <div className="p-5">
            <ProblemPanel problem={list.problem} canFix={canFix} />
          </div>
        ) : list.value.rows.length === 0 ? (
          <EmptyState icon={Users} title={q ? `No customers match “${q}”` : "No customers yet"} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="ledger-table min-w-[760px]">
                <thead>
                  <tr>
                    <th scope="col">Customer</th>
                    <th scope="col">Location</th>
                    <th scope="col">Last order</th>
                    <th scope="col" className="num">Orders</th>
                    <th scope="col" className="num">Total spend</th>
                    <th scope="col" className="num">Avg. order</th>
                  </tr>
                </thead>
                <tbody>
                  {list.value.rows.map((c) => (
                    <tr key={c.id} className="transition-colors hover:bg-[color-mix(in_oklab,var(--band)_3%,white)]">
                      <td>
                        <Link href={`/admin/customers/${c.id}`} className="font-medium text-ink underline-offset-4 hover:text-green hover:underline">
                          {c.name}
                        </Link>
                        <span className="flex items-center gap-2 text-[12.5px] text-ink-muted">
                          <span className="truncate">{c.email}</span>
                          {c.userId === 0 && <Pill tone="muted">Guest</Pill>}
                        </span>
                      </td>
                      <td className="text-ink-muted">{c.location || "—"}</td>
                      <td className="text-ink-muted">{c.lastOrderAt ? <LocalTime value={`${c.lastOrderAt}T12:00:00Z`} format="date" /> : "—"}</td>
                      <td className="num">{formatCount(c.ordersCount)}</td>
                      <td className="num">{formatMoney(c.totalSpendMinor, c.currency)}</td>
                      <td className="num text-ink-muted">{formatMoney(c.averageMinor, c.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              path="/admin/customers"
              params={params}
              page={page}
              perPage={PER_PAGE}
              total={list.value.total}
              totalPages={list.value.totalPages}
              noun="customers"
            />
          </>
        )}
      </div>
    </>
  );
}
