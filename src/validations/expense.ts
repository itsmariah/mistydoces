import { z } from "zod";
import { EXPENSE_CATEGORIES } from "@/lib/finance";

export const expenseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Informe o que foi comprado.")
    .max(80, "Use no máximo 80 caracteres."),
  category: z.enum(EXPENSE_CATEGORIES, { message: "Escolha uma categoria." }),
  amount: z
    .number({ message: "Informe o valor." })
    .positive("O valor deve ser maior que zero.")
    .max(99_999_999.99, "Valor alto demais.")
    .transform((value) => Math.round(value * 100) / 100),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data.")
    .refine((value) => {
      // Rejeita dias que não existem (31/02), que o Date "rolaria" para o mês seguinte.
      const date = new Date(`${value}T12:00:00Z`);
      return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
    }, "Data inválida."),
});

export type ExpenseInput = z.input<typeof expenseSchema>;
export type ExpenseData = z.output<typeof expenseSchema>;
