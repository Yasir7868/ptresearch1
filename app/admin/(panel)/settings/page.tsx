import type { Metadata } from "next";
import { CircleCheck, CircleX, Smartphone, TriangleAlert } from "lucide-react";
import { requestOrigin } from "@/lib/admin/actions";
import { requirePermission } from "@/lib/admin/auth";
import { configSummary, wpOrigin } from "@/lib/admin/config";
import { settle } from "@/lib/admin/woo/client";
import { WEBHOOK_PATH, WEBHOOK_TOPICS, getWebhookHealth, listWebhooks } from "@/lib/admin/woo/webhooks";
import { Notice } from "@/components/admin/Feedback";
import { LocalTime } from "@/components/admin/LocalTime";
import { PageHeader } from "@/components/admin/PageHeader";
import { Panel } from "@/components/admin/Panel";
import { Pill } from "@/components/admin/StatusBadge";
import { CopyButton } from "@/components/admin/FormBits";
import {
  ActivateWebhookButton,
  ConnectWebhooksButton,
  ConnectionTester,
} from "@/components/admin/settings/SettingsControls";

export const metadata: Metadata = { title: "Settings" };

function Check({ ok, label, detail }: { ok: boolean; label: string; detail?: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      {ok ? (
        <CircleCheck aria-label="Set" className="mt-0.5 size-4 shrink-0 text-ok" />
      ) : (
        <CircleX aria-label="Missing" className="mt-0.5 size-4 shrink-0 text-error" />
      )}
      <span className="min-w-0">
        <span className="block font-medium text-ink">{label}</span>
        {detail && <span className="block break-words text-ink-muted">{detail}</span>}
      </span>
    </li>
  );
}

const code = "rounded bg-secondary px-1.5 py-0.5 text-[12.5px] text-ink";

export default async function SettingsPage() {
  await requirePermission("settings.manage");
  const config = configSummary();
  const origin = await requestOrigin();
  const deliveryUrl = `${origin}${WEBHOOK_PATH}`;
  const health = getWebhookHealth();
  const hooks = config.wooConnected ? await settle(listWebhooks()) : null;
  const ours = hooks?.ok ? hooks.value.filter((w) => w.delivery_url.replace(/\/+$/, "") === deliveryUrl) : [];
  const missing = WEBHOOK_TOPICS.filter((topic) => !ours.some((w) => w.topic === topic && w.status === "active"));

  return (
    <>
      <PageHeader
        title="Settings"
        description="How this admin panel connects to WooCommerce. Secrets are set as environment variables on the server and never shown here."
      />

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <Panel title="WooCommerce connection" description="Orders, products and customers are read and written through the WooCommerce REST API.">
          <ul className="flex flex-col gap-3">
            <Check ok={config.originIsHttps} label="Store address (WP_ORIGIN)" detail={config.wpOrigin} />
            <Check
              ok={config.wooConnected && config.consumerKeyLooksValid}
              label="API key (WOO_CONSUMER_KEY)"
              detail={config.consumerKey ?? "Not set"}
            />
            <Check ok={config.consumerSecretSet} label="API secret (WOO_CONSUMER_SECRET)" detail={config.consumerSecretSet ? "Set" : "Not set"} />
            <Check
              ok
              label="Authentication mode (WOO_AUTH_MODE)"
              detail={config.authMode === "query" ? "Keys sent as query parameters" : "Authorization header (default)"}
            />
          </ul>
          <div className="mt-5 border-t border-hairline/70 pt-5">
            <ConnectionTester disabled={!config.wooConnected} />
          </div>
          {!config.wooConnected && (
            <details className="mt-5 rounded-xl bg-paper p-4 text-sm">
              <summary className="cursor-pointer font-medium text-ink">How to create the API keys</summary>
              <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-ink-muted">
                <li>
                  In WordPress go to{" "}
                  <a className="text-green underline underline-offset-4" href={`${wpOrigin()}/wp-admin/admin.php?page=wc-settings&tab=advanced&section=keys`} target="_blank" rel="noreferrer">
                    WooCommerce → Settings → Advanced → REST API
                  </a>{" "}
                  and click Add key.
                </li>
                <li>Description: “Admin panel”. User: an Administrator (or a Shop manager). Permissions: <strong className="text-ink">Read/Write</strong>.</li>
                <li>
                  Copy the consumer key and secret into <code className={code}>WOO_CONSUMER_KEY</code> and{" "}
                  <code className={code}>WOO_CONSUMER_SECRET</code> on the server, then restart the app.
                </li>
              </ol>
            </details>
          )}
        </Panel>

        <Panel title="Real-time updates" description="Webhooks make WooCommerce notify this panel the moment an order or product changes anywhere.">
          <ul className="flex flex-col gap-3">
            <Check ok={config.webhookSecretSet} label="Webhook secret (WOO_WEBHOOK_SECRET)" detail={config.webhookSecretSet ? "Set" : "Not set: webhooks will be rejected"} />
            <Check
              ok={Boolean(health.lastReceived)}
              label="Last update received"
              detail={
                health.lastReceived ? (
                  <>
                    {health.lastReceived.topic} · <LocalTime value={health.lastReceived.at} format="relative" />
                  </>
                ) : (
                  "Nothing received yet"
                )
              }
            />
          </ul>
          {health.lastRejected && (!health.lastReceived || health.lastRejected.at > health.lastReceived.at) && (
            <Notice className="mt-4" icon={TriangleAlert}>
              A delivery was rejected <LocalTime value={health.lastRejected.at} format="relative" />: {health.lastRejected.reason}
            </Notice>
          )}

          <div className="mt-5 flex flex-col gap-2">
            <p className="text-[13px] font-medium text-ink">Delivery URL</p>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg border border-hairline bg-paper px-2.5 py-2 text-[13px] text-ink">{deliveryUrl}</code>
              <CopyButton value={deliveryUrl} />
            </div>
          </div>

          {hooks && !hooks.ok && <p className="mt-4 text-sm text-error">{hooks.problem.message}</p>}
          {hooks?.ok && (
            <div className="mt-5">
              <p className="mb-2 text-[13px] font-medium text-ink">Webhooks for this address in WooCommerce</p>
              {ours.length === 0 ? (
                <p className="text-sm text-ink-muted">None yet.</p>
              ) : (
                <ul className="divide-y divide-hairline/70 rounded-xl border border-hairline">
                  {ours.map((w) => (
                    <li key={w.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                      <span className="data-num text-ink">{w.topic}</span>
                      {w.status === "active" ? <Pill tone="success">Active</Pill> : <ActivateWebhookButton webhookId={w.id} />}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="mt-5 border-t border-hairline/70 pt-5">
            {missing.length > 0 ? (
              <>
                <p className="mb-3 text-sm text-ink-muted">
                  {missing.length} of {WEBHOOK_TOPICS.length} webhooks still needed: {missing.join(", ")}.
                </p>
                <ConnectWebhooksButton disabled={!config.wooConnected || !config.webhookSecretSet} />
              </>
            ) : (
              <p className="flex items-center gap-2 text-sm text-ink">
                <CircleCheck aria-hidden="true" className="size-4 text-ok" /> All webhooks are connected and active.
              </p>
            )}
            <details className="mt-4 text-sm">
              <summary className="cursor-pointer font-medium text-ink">Set them up by hand instead</summary>
              <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-ink-muted">
                <li>
                  WooCommerce → Settings → Advanced →{" "}
                  <a className="text-green underline underline-offset-4" href={`${wpOrigin()}/wp-admin/admin.php?page=wc-settings&tab=advanced&section=webhooks`} target="_blank" rel="noreferrer">
                    Webhooks
                  </a>{" "}
                  → Add webhook.
                </li>
                <li>Status Active, Delivery URL as above, Secret = the value of WOO_WEBHOOK_SECRET, API version WP REST API Integration v3.</li>
                <li>Create one webhook for each topic: {WEBHOOK_TOPICS.join(", ")}.</li>
              </ol>
            </details>
          </div>
        </Panel>

        <Panel title="WooCommerce mobile app">
          <div className="flex gap-3 text-sm text-ink">
            <Smartphone aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-green" />
            <div className="flex flex-col gap-2">
              <p>
                The WooCommerce app, WP admin and this panel all work on the same WooCommerce orders. An order placed on the
                website appears in all three; a status changed in the app shows here, and the other way round.
              </p>
              <p className="text-ink-muted">
                Changes made here are added to the order notes with the person&apos;s name, so they are visible in the app too.
                Keep push notifications on in the app for instant alerts on your phone; open tabs of this panel also alert you
                about new orders.
              </p>
            </div>
          </div>
        </Panel>

        <Panel title="Admin database" description="Staff accounts, sessions and the activity log. WooCommerce data is never stored here.">
          {"error" in config.db ? (
            <Notice icon={TriangleAlert}>{config.db.error}</Notice>
          ) : (
            <ul className="flex flex-col gap-3">
              <Check ok label="Location" detail={<code className={code}>{config.db.path}</code>} />
              <Check
                ok={config.db.source !== "development default"}
                label="Persistent storage"
                detail={
                  config.db.source === "development default"
                    ? "Using the local development default. In production set ADMIN_DB_PATH to a file on a persistent volume."
                    : `Configured by ${config.db.source}. Back this file up with the volume.`
                }
              />
              <Check ok={!config.setupTokenSet} label="Setup token" detail={config.setupTokenSet ? "ADMIN_SETUP_TOKEN is still set. It's only needed once; you can remove it." : "Not set (setup is complete)."} />
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
