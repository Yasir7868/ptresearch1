import type { Metadata } from "next";
import { requireUser } from "@/lib/admin/auth";
import { PERMISSIONS, PERMISSION_INFO, ROLE_INFO, can } from "@/lib/admin/permissions";
import { listSessions } from "@/lib/admin/session";
import { PageHeader } from "@/components/admin/PageHeader";
import { DetailList, Panel } from "@/components/admin/Panel";
import { DesktopAlertsToggle, NameForm, PasswordForm, SessionsList } from "@/components/admin/account/AccountForms";

export const metadata: Metadata = { title: "Your account" };

export default async function AccountPage() {
  const user = await requireUser();
  const sessions = listSessions(user.id, user.sessionId);
  const granted = PERMISSIONS.filter((p) => can(user.role, p));

  return (
    <>
      <PageHeader title="Your account" description={user.email} />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Panel title="Profile">
            <NameForm name={user.name} />
          </Panel>
          <Panel title="Password">
            <PasswordForm email={user.email} />
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          <Panel title="New order alerts">
            <DesktopAlertsToggle />
          </Panel>
          <Panel title="Signed-in devices">
            <SessionsList sessions={sessions} />
          </Panel>
          <Panel title="Your access">
            <DetailList
              rows={[
                { label: "Role", value: `${ROLE_INFO[user.role].label}: ${ROLE_INFO[user.role].summary}` },
                {
                  label: "You can",
                  value: (
                    <ul className="mt-1 flex list-disc flex-col gap-1 pl-5 text-ink">
                      {granted.map((p) => (
                        <li key={p}>{PERMISSION_INFO[p].label}</li>
                      ))}
                    </ul>
                  ),
                },
              ]}
            />
            <p className="mt-4 text-[13px] text-ink-muted">Only an owner can change your role.</p>
          </Panel>
        </div>
      </div>
    </>
  );
}
