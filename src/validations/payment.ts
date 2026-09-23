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

// Formato devolvido pelo Payment Brick do Mercado Pago no onSubmit — validamos
// os campos que realmente usamos antes de repassar pra API de pagamentos.
const cardPaymentFormDataSchema = z.object({
  token: z.string().min(1),
  issuer_id: z.string().min(1),
  payment_method_id: z.string().min(1),
  installments: z.number().int().min(1),
  payer: z.object({
    email: z.string().email(),
    identification: z.object({
      type: z.string().min(1),
      number: z.string().min(1),
    }),
  }),
});

export const createCardPaymentSchema = z.object({
  orderId: z.string().min(1),
  formData: cardPaymentFormDataSchema,
});

export type CreateCardPaymentInput = z.infer<typeof createCardPaymentSchema>;
