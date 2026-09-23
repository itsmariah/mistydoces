import { z } from "zod";
import { isValidCpf } from "@/lib/cpf";

export const createPixPaymentSchema = z.object({
  orderId: z.string().min(1),
  document: z
    .string()
    .trim()
    .refine(isValidCpf, "Informe um CPF válido."),
});

export type CreatePixPaymentInput = z.infer<typeof createPixPaymentSchema>;
