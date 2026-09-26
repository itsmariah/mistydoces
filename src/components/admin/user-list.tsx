import type { listUsers } from "@/services/user-service";
import { ROLE_LABELS, isStaff } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";

type User = Awaited<ReturnType<typeof listUsers>>[number];

// Só leitura: níveis de acesso são geridos na página Equipe.
export function UserList({ users, currentUserId }: { users: User[]; currentUserId: string }) {
  return (
    <div className="space-y-3">
      {users.map((user) => (
        <div key={user.id} className="space-y-1 rounded-lg border border-border p-4">
          <div className="flex items-center gap-2">
            <span className="font-medium">{user.name}</span>
            {isStaff(user.role) && <Badge>{ROLE_LABELS[user.role]}</Badge>}
            {user.id === currentUserId && <Badge variant="outline">Você</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">
            {user.email} — {user.phone}
          </p>
          <p className="text-xs text-muted-foreground">{user._count.orders} pedido(s)</p>
        </div>
      ))}
    </div>
  );
}
