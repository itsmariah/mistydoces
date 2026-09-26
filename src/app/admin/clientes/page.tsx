import Link from "next/link";
import { can } from "@/lib/permissions";
import { requirePagePermission } from "@/lib/require-permission";
import { listUsers } from "@/services/user-service";
import { UserList } from "@/components/admin/user-list";

export default async function AdminCustomersPage() {
  const user = await requirePagePermission("customers:view");
  const users = await listUsers();

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Clientes</h1>
        {can(user.role, "team:manage") && (
          <p className="text-sm text-muted-foreground">
            Para dar acesso ao painel a alguém, use a página{" "}
            <Link href="/admin/equipe" className="text-link underline-offset-4 hover:underline">
              Equipe
            </Link>
            .
          </p>
        )}
      </div>
      <UserList users={users} currentUserId={user.id} />
    </div>
  );
}
