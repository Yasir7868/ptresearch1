import type { Metadata } from "next";
import { Check, Minus, Smartphone } from "lucide-react";
import { requirePermission } from "@/lib/admin/auth";
import { wpOrigin } from "@/lib/admin/config";
import {
  PERMISSIONS,
  PERMISSION_GROUPS,
  PERMISSION_INFO,
  ROLES,
  ROLE_INFO,
  can,
} from "@/lib/admin/permissions";
import { listTeam } from "@/lib/admin/users";
import { Notice } from "@/components/admin/Feedback";
import { PageHeader } from "@/components/admin/PageHeader";
import { Panel } from "@/components/admin/Panel";
import { TeamManager } from "@/components/admin/team/TeamManager";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const user = await requirePermission("team.manage");
  const members = listTeam();

  return (
    <>
      <PageHeader
        title="Team"
        description="Give people access to this admin panel and decide what they can do. Changes apply immediately."
      />

      <div className="flex flex-col gap-4">
        <section className="soft-card overflow-hidden">
          <TeamManager members={members} currentUserId={user.id} />
        </section>

        <Notice tone="info" icon={Smartphone}>
          Access here is separate from WordPress logins. Anyone who also needs the WooCommerce mobile app signs in to the
          app with a WordPress account: create one in{" "}
          <a
            href={`${wpOrigin()}/wp-admin/user-new.php`}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-green underline underline-offset-4"
          >
            WP admin → Users
          </a>{" "}
          with the Shop manager role.
        </Notice>

        <Panel title="What each role can do" bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="ledger-table min-w-[640px]">
              <thead>
                <tr>
                  <th scope="col">Permission</th>
                  {ROLES.map((role) => (
                    <th key={role} scope="col" style={{ textAlign: "center" }}>
                      {ROLE_INFO[role].label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSION_GROUPS.map((group) => (
                  <GroupRows key={group} group={group} />
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  );
}

function GroupRows({ group }: { group: (typeof PERMISSION_GROUPS)[number] }) {
  const permissions = PERMISSIONS.filter((p) => PERMISSION_INFO[p].group === group);
  return (
    <>
      <tr>
        {/* .ledger-table th styles are unlayered CSS, so overrides go inline. */}
        <th scope="rowgroup" colSpan={ROLES.length + 1} style={{ background: "var(--paper)" }}>
          {group}
        </th>
      </tr>
      {permissions.map((permission) => (
        <tr key={permission}>
          <th
            scope="row"
            style={{ fontSize: 14, fontWeight: 430, textTransform: "none", letterSpacing: 0, color: "var(--ink)" }}
          >
            {PERMISSION_INFO[permission].label}
          </th>
          {ROLES.map((role) => (
            <td key={role} className="text-center">
              {can(role, permission) ? (
                <Check aria-label="Yes" className="mx-auto size-4 text-ok" />
              ) : (
                <Minus aria-label="No" className="mx-auto size-4 text-ink-muted/50" />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
