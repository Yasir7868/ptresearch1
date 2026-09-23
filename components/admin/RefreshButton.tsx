"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { refreshStoreData } from "@/app/admin/(panel)/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Re-reads WooCommerce, skipping the few minutes of cached figures. */
export function RefreshButton({ label = "Refresh" }: { label?: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="outline"
      className="h-9 px-3"
      disabled={pending}
      onClick={() => startTransition(() => refreshStoreData())}
    >
      <RefreshCw aria-hidden="true" className={cn(pending && "animate-spin")} />
      {pending ? "Refreshing…" : label}
    </Button>
  );
}
