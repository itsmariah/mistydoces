"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { addTeamMember } from "@/actions/users";
import { ROLE_LABELS, STAFF_ROLES } from "@/lib/permissions";
import { teamMemberSchema, type TeamMemberInput } from "@/validations/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STAFF_ROLE_ITEMS = Object.fromEntries(STAFF_ROLES.map((role) => [role, ROLE_LABELS[role]]));

export function TeamMemberForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeamMemberInput>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: { email: "", role: "STAFF" },
  });

  function onSubmit(data: TeamMemberInput) {
    setFormError(null);
    startTransition(async () => {
      const result = await addTeamMember(data);
      if (!result.success) {
        setFormError(result.error.message);
        return;
      }
      toast.success(`${data.email} agora faz parte da equipe como ${ROLE_LABELS[data.role]}.`);
      reset();
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-4"
      noValidate
    >
      <div className="min-w-56 flex-1 space-y-1.5">
        <Label htmlFor="team-email">E-mail da conta</Label>
        <Input id="team-email" type="email" placeholder="pessoa@exemplo.com" {...register("email")} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="team-role">Nível</Label>
        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <Select items={STAFF_ROLE_ITEMS} value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="team-role" className="w-40">
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
          )}
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Adicionando..." : "Adicionar à equipe"}
      </Button>

      {formError && <p className="w-full text-sm text-destructive">{formError}</p>}
    </form>
  );
}
