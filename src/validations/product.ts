import { z } from "zod";

const variantSchema = z.object({
  // Presente = variante já existente (edição); ausente = variante nova.
  id: z.string().optional(),
  label: z.string().trim().min(1, "Informe o nome da variante."),
  price: z.number().positive("O preço deve ser maior que zero."),
});

export const productSchema = z
  .object({
    name: z.string().trim().min(2, "Informe o nome do produto."),
    description: z.string().trim().min(5, "Informe uma descrição."),
    categoryId: z.string().min(1, "Selecione uma categoria."),
    imageUrl: z.string().trim().optional(),
    isAvailable: z.boolean(),
    isActive: z.boolean(),
    leadTimeDays: z
      .number({ error: "Informe a antecedência (0 para pronta-entrega)." })
      .int("Use dias inteiros.")
      .min(0, "A antecedência não pode ser negativa.")
      .max(60, "Use no máximo 60 dias."),
    variants: z.array(variantSchema).min(1, "Adicione pelo menos uma variante."),
  })
  .refine(
    (data) =>
      new Set(data.variants.map((v) => v.label.trim().toLowerCase())).size ===
      data.variants.length,
    { message: "Os nomes das variantes devem ser únicos.", path: ["variants"] },
  );

export type ProductInput = z.infer<typeof productSchema>;
