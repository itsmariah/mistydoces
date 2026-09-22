import { z } from "zod";

export const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "O código deve ter pelo menos 3 caracteres.")
      .transform((value) => value.toUpperCase()),
    type: z.enum(["PERCENTAGE", "FIXED"]),
    value: z.number().positive("O valor deve ser maior que zero."),
    minOrderValue: z.number().min(0).optional(),
    maxUses: z.number().int().positive().optional(),
    isActive: z.boolean(),
    expiresAt: z.string().optional(),
  })
  .refine((data) => data.type !== "PERCENTAGE" || data.value <= 100, {
    message: "Desconto percentual não pode passar de 100%.",
    path: ["value"],
  });

export type CouponInput = z.infer<typeof couponSchema>;

export const applyCouponSchema = z.object({
  code: z.string().trim().min(1, "Informe um código de cupom."),
  subtotal: z.number().nonnegative(),
});

export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
