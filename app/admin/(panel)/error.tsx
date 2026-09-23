"use client";

import { useEffect } from "react";
import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="soft-card mx-auto mt-6 flex max-w-lg flex-col items-center px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--error)_10%,white)]">
        <CircleAlert aria-hidden="true" className="size-5 text-error" />
      </span>
      <h1 className="mt-4 text-xl font-semibold text-ink">This page hit a problem</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Nothing was changed. Try again; if it keeps happening, the server logs have the details
        {error.digest ? ` (reference ${error.digest})` : ""}.
      </p>
      <Button type="button" className="mt-6 h-9 px-4" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
