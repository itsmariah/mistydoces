import { can } from "@/lib/permissions";
import { requirePagePermission } from "@/lib/require-permission";
import { listUsers } from "@/services/user-service";
import { UserList } from "@/components/admin/user-list";

export default async function AdminCustomersPage() {
  const user = await requirePagePermission("customers:view");
  const users = await listUsers();

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <h1 className="font-heading text-2xl font-semibold">Clientes</h1>
      <UserList
        users={users}
        currentUserId={user.id}
        canManageTeam={can(user.role, "team:manage")}
      />
    </div>
  );
}
