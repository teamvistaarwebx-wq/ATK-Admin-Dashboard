import { PageHeader } from "@/components/layout/page-header";
import { Settings } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ADMIN_ROLE } from "@/constants/enums";
import { requireAdmin } from "@/lib/auth/dal";
import { getAdminUsers } from "@/features/users/queries/get-admin-users";
import { InviteForm } from "@/features/users/components/invite-form";
import { TeamList } from "@/features/users/components/team-list";

export const metadata = { title: "Settings | AKT Gifting Admin" };

export default async function SettingsPage() {
  const session = await requireAdmin();
  const isSuperAdmin = session.role === ADMIN_ROLE.SUPER_ADMIN;

  const users = await getAdminUsers();

  return (
    <>
      <PageHeader
        title="Settings"
        icon={<Settings className="h-5 w-5" strokeWidth={2} />}
        subtitle="Who can sign in to this admin, and what they can reach."
      />

      <div className="flex flex-col gap-6 mx-auto w-full max-w-[1400px] px-4 pb-10 sm:px-6">
        {isSuperAdmin ? (
          <Card
            title="Invite a team member"
            subtitle="They set their own password from the link you send."
          >
            <InviteForm />
          </Card>
        ) : null}

        <Card
          title="Team"
          subtitle={`${users.length} ${users.length === 1 ? "account" : "accounts"}`}
          className="pb-1"
        >
          <div className="mt-4">
            <TeamList users={users} />
          </div>
        </Card>
      </div>
    </>
  );
}
