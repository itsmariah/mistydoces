"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Role } from "@/generated/prisma/client";
import type { listTeam } from "@/services/user-service";
import { setUserRole } from "@/actions/users";
import { ROLE_LABELS, STAFF_ROLES } from "@/lib/permissions";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
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
  // Mudança escolhida aguardando confirmação; CUSTOMER = remover da equipe. Fica
  // guardada após fechar para o texto do diálogo não sumir durante a animação de saída.
  const [pendingChange, setPendingChange] = useState<{ member: Member; role: Role } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  function askChange(member: Member, role: Role) {
    setPendingChange({ member, role });
    setDialogOpen(true);
  }

  async function handleConfirm() {
    if (!pendingChange) return;
    const { member, role } = pendingChange;
    const result = await setUserRole(member.id, role);
    if (!result.success) {
      toast.error(result.error.message);
      return;
    }
    toast.success(
      role === "CUSTOMER"
        ? `${member.name} saiu da equipe.`
        : `${member.name} agora é ${ROLE_LABELS[role]}.`,
    );
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {members.map((member) => {
        const isSelf = member.id === currentUserId;

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

            {!isSelf && (
              <div className="flex items-center gap-2">
                <Select
                  items={STAFF_ROLE_ITEMS}
                  value={member.role}
                  onValueChange={(role: Role | null) => {
                    if (role && role !== member.role) askChange(member, role);
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
                  onClick={() => askChange(member, "CUSTOMER")}
                >
                  Remover
                </Button>
              </div>
            )}
          </div>
        );
      })}

      <ConfirmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={
          pendingChange?.role === "CUSTOMER"
            ? `Remover ${pendingChange.member.name} da equipe?`
            : `Alterar ${pendingChange?.member.name} para ${pendingChange ? ROLE_LABELS[pendingChange.role] : ""}?`
        }
        description={
          pendingChange?.role === "CUSTOMER"
            ? "A pessoa perde o acesso ao painel na hora, mas continua com a conta de cliente."
            : "O novo nível vale a partir da próxima página que a pessoa abrir."
        }
        confirmLabel={pendingChange?.role === "CUSTOMER" ? "Remover" : "Alterar nível"}
        destructive={pendingChange?.role === "CUSTOMER"}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
