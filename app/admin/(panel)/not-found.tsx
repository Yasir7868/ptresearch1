import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminNotFound() {
  return (
    <div className="soft-card mx-auto mt-6 flex max-w-lg flex-col items-center px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-secondary">
        <SearchX aria-hidden="true" className="size-5 text-ink-muted" />
      </span>
      <h1 className="mt-4 text-xl font-semibold text-ink">Not found</h1>
      <p className="mt-2 text-sm text-ink-muted">
        This page doesn&apos;t exist, or the order or customer was deleted in WooCommerce.
      </p>
      <div className="mt-6 flex gap-2">
        <Button asChild className="h-9 px-4">
          <Link href="/admin">Dashboard</Link>
        </Button>
        <Button asChild variant="outline" className="h-9 px-4">
          <Link href="/admin/orders">Orders</Link>
        </Button>
      </div>
    </div>
  );
}
