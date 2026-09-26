"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@/generated/prisma/client";
import type { listTeam } from "@/services/user-service";
import { setUserRole } from "@/actions/users";
import { ROLE_LABELS, STAFF_ROLES } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Member = Awaited<ReturnType<typeof listTeam>>[number];

const STAFF_ROLE_ITEMS = Object.fromEntries(STAFF_ROLES.map((role) => [role, ROLE_LABELS[role]]));

export function TeamList({ members, currentUserId }: { members: Member[]; currentUserId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Mudança escolhida aguardando confirmação; CUSTOMER = remover da equipe.
  const [pendingChange, setPendingChange] = useState<{ userId: string; role: Role } | null>(null);

  function handleConfirm() {
    if (!pendingChange) return;
    setError(null);
    startTransition(async () => {
      const result = await setUserRole(pendingChange.userId, pendingChange.role);
      setPendingChange(null);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-destructive">{error}</p>}

      {members.map((member) => {
        const isSelf = member.id === currentUserId;
        const pending = pendingChange?.userId === member.id ? pendingChange : null;

        return (
          <div
            key={member.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{member.name}</span>
                <Badge>{ROLE_LABELS[member.role]}</Badge>
                {isSelf && <Badge variant="outline">Você</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{member.email}</p>
            </div>

            {!isSelf &&
              (pending ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    {pending.role === "CUSTOMER"
                      ? "Remover da equipe?"
                      : `Alterar para ${ROLE_LABELS[pending.role]}?`}
                  </span>
                  <Button
                    size="sm"
                    variant={pending.role === "CUSTOMER" ? "destructive" : "default"}
                    disabled={isPending}
                    onClick={handleConfirm}
                  >
                    Sim
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => setPendingChange(null)}
                  >
                    Voltar
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Select
                    items={STAFF_ROLE_ITEMS}
                    value={member.role}
                    onValueChange={(role: Role | null) => {
                      if (role && role !== member.role) {
                        setPendingChange({ userId: member.id, role });
                      }
                    }}
                  >
                    <SelectTrigger aria-label={`Nível de ${member.name}`} className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAFF_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPendingChange({ userId: member.id, role: "CUSTOMER" })}
                  >
                    Remover
                  </Button>
                </div>
              ))}
          </div>
        );
      })}
    </div>
  );
}
