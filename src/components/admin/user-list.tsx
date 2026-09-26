import Link from "next/link";
import type { listUsers } from "@/services/user-service";
import { ROLE_LABELS, isStaff } from "@/lib/permissions";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type User = Awaited<ReturnType<typeof listUsers>>["users"][number];

// Só leitura: níveis de acesso são geridos na página Equipe.
export function UserList({
  users,
  currentUserId,
  canViewOrders,
  isSearch,
}: {
  users: User[];
  currentUserId: string;
  canViewOrders: boolean;
  isSearch: boolean;
}) {
  if (users.length === 0) {
    return (
      <EmptyState
        image={{ src: "/branding/02_gatinha_dormindo.png", width: 146, height: 120 }}
        title={isSearch ? "Nenhum cliente encontrado" : "Nenhum cliente ainda"}
        description={
          isSearch
            ? "Nenhum cliente combina com essa busca."
            : "Quando alguém criar uma conta na loja, aparece aqui."
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <div
          key={user.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-border p-4"
        >
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{user.name}</span>
              {isStaff(user.role) && <Badge>{ROLE_LABELS[user.role]}</Badge>}
              {user.id === currentUserId && <Badge variant="outline">Você</Badge>}
            </div>
            <p className="truncate text-sm text-muted-foreground">
              {user.email} — {user.phone}
            </p>
            <p className="text-xs text-muted-foreground">{user._count.orders} pedido(s)</p>
          </div>
          {canViewOrders && user._count.orders > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              nativeButton={false}
              render={<Link href={`/admin/pedidos?cliente=${user.id}`} />}
            >
              Ver pedidos
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
