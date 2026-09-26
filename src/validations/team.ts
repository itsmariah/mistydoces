import { z } from "zod";
import { STAFF_ROLES } from "@/lib/permissions";

export const teamMemberSchema = z.object({
  email: z.email("E-mail inválido.").trim(),
  role: z.enum(STAFF_ROLES, "Escolha um nível de acesso."),
});

export type TeamMemberInput = z.infer<typeof teamMemberSchema>;

/** Troca de nível de quem já está na equipe; CUSTOMER remove da equipe. */
export const roleChangeSchema = z.enum(["CUSTOMER", ...STAFF_ROLES], "Nível de acesso inválido.");
