"use client";

import { useState, useTransition } from "react";
import { CircleCheck, CircleX, LoaderCircle, PlugZap, Webhook } from "lucide-react";
import { activateWebhook, connectWebhooks, runConnectionTest } from "@/app/admin/(panel)/settings/actions";
import type { ActionState } from "@/lib/admin/action-state";
import type { ConnectionReport } from "@/lib/admin/woo/connection";
import { Button } from "@/components/ui/button";
import { FormMessage } from "../FormBits";
import { LocalTime } from "../LocalTime";

export function ConnectionTester({ disabled }: { disabled: boolean }) {
  const [pending, startTransition] = useTransition();
  const [report, setReport] = useState<ConnectionReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Button
          type="button"
          className="h-9 px-3.5"
          disabled={disabled || pending}
          onClick={() =>
            startTransition(async () => {
              const result = await runConnectionTest();
              if (result.ok) {
                setReport(result.report);
                setError(null);
              } else {
                setError(result.message);
              }
            })
          }
        >
          {pending ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <PlugZap aria-hidden="true" />}
          {pending ? "Testing…" : "Test connection"}
        </Button>
      </div>
      {error && <FormMessage state={{ status: "error", message: error }} />}
      {report && (
        <div role="status" className="rounded-xl border border-hairline bg-paper p-4">
          <p className="text-sm font-semibold text-ink">
            {report.ok ? "Everything checks out." : "Some checks failed."}{" "}
            <span className="font-normal text-ink-muted">
              Tested <LocalTime value={report.checkedAt} format="time" />
            </span>
          </p>
          <ul className="mt-3 flex flex-col gap-2.5">
            {report.checks.map((check) => (
              <li key={check.id} className="flex items-start gap-2.5 text-sm">
                {check.ok ? (
                  <CircleCheck aria-label="Passed" className="mt-0.5 size-4 shrink-0 text-ok" />
                ) : (
                  <CircleX aria-label="Failed" className="mt-0.5 size-4 shrink-0 text-error" />
                )}
                <span>
                  <span className="block font-medium text-ink">{check.label}</span>
                  <span className="block text-ink-muted">{check.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function ConnectWebhooksButton({ disabled }: { disabled: boolean }) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<ActionState>({ status: "idle" });
  return (
    <div className="flex flex-col gap-3">
      <div>
        <Button
          type="button"
          className="h-9 px-3.5"
          disabled={disabled || pending}
          onClick={() => startTransition(async () => setState(await connectWebhooks()))}
        >
          {pending ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <Webhook aria-hidden="true" />}
          {pending ? "Connecting…" : "Connect webhooks automatically"}
        </Button>
      </div>
      <FormMessage state={state} />
    </div>
  );
}

export function ActivateWebhookButton({ webhookId }: { webhookId: number }) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<ActionState>({ status: "idle" });
  return (
    <span className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        className="h-8 px-2.5"
        disabled={pending}
        onClick={() => startTransition(async () => setState(await activateWebhook(webhookId)))}
      >
        {pending ? "Activating…" : "Activate"}
      </Button>
      {state.status === "error" && <span className="text-[12px] text-error">{state.message}</span>}
    </span>
  );
}
