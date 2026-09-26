"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { listUsers } from "@/services/user-service";
import { setUserRole } from "@/actions/users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS, isStaff } from "@/lib/permissions";

type User = Awaited<ReturnType<typeof listUsers>>[number];

export function UserList({
  users,
  currentUserId,
  canManageTeam,
}: {
  users: User[];
  currentUserId: string;
  canManageTeam: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  function handleToggleRole(userId: string, nextRole: "OWNER" | "CUSTOMER") {
    setError(null);
    startTransition(async () => {
      const result = await setUserRole(userId, nextRole);
      if (!result.success) {
        setError(result.error.message);
        setConfirmingId(null);
        return;
      }
      setConfirmingId(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-destructive">{error}</p>}

      {users.map((user) => {
        const isSelf = user.id === currentUserId;
        const nextRole = isStaff(user.role) ? "CUSTOMER" : "OWNER";

        return (
          <div
            key={user.id}
            className="flex items-center justify-between rounded-lg border border-border p-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{user.name}</span>
                <Badge variant={isStaff(user.role) ? "default" : "secondary"}>
                  {ROLE_LABELS[user.role]}
                </Badge>
                {isSelf && <Badge variant="outline">Você</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">
                {user.email} — {user.phone}
              </p>
              <p className="text-xs text-muted-foreground">
                {user._count.orders} pedido(s)
              </p>
            </div>

            {canManageTeam &&
              !isSelf &&
              (confirmingId === user.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    {nextRole === "OWNER" ? "Promover a proprietário?" : "Rebaixar a cliente?"}
                  </span>
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleToggleRole(user.id, nextRole)}
                  >
                    Sim
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => setConfirmingId(null)}
                  >
                    Voltar
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setConfirmingId(user.id)}>
                  {isStaff(user.role) ? "Rebaixar a cliente" : "Promover a proprietário"}
                </Button>
              ))}
          </div>
        );
      })}
    </div>
  );
}
