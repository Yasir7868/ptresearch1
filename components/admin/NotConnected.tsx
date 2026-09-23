import Link from "next/link";
import { PlugZap } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Shown in place of store data while WooCommerce API keys aren't configured. */
export function NotConnected({ canFix }: { canFix: boolean }) {
  return (
    <div className="soft-card flex flex-col items-center px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--green)_10%,white)]">
        <PlugZap aria-hidden="true" className="size-6 text-green" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-ink">Connect your WooCommerce store</h2>
      <p className="mt-1.5 max-w-md text-sm text-ink-muted">
        {canFix
          ? "Orders, stock and sales appear here once the WooCommerce REST API keys are added. It takes about five minutes."
          : "An owner needs to connect the WooCommerce store before orders and sales appear here."}
      </p>
      {canFix && (
        <Button asChild className="mt-5 h-9 px-4">
          <Link href="/admin/settings">Open connection settings</Link>
        </Button>
      )}
    </div>
  );
}
