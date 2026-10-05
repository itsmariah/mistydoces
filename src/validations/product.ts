import { z } from "zod";
import { ALLERGENS } from "@/lib/allergens";

/** Capa + galeria. Mais que isso pesa a página sem ajudar a escolher. */
export const MAX_PRODUCT_IMAGES = 6;

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
    /** Em ordem: a primeira é a capa (`Product.imageUrl`), as outras viram `ProductImage`. */
    images: z
      .array(z.string().trim().min(1))
      .max(MAX_PRODUCT_IMAGES, `Use no máximo ${MAX_PRODUCT_IMAGES} fotos.`)
      .refine((urls) => new Set(urls).size === urls.length, "A mesma foto foi adicionada duas vezes."),
    isAvailable: z.boolean(),
    isActive: z.boolean(),
    leadTimeDays: z
      .number({ error: "Informe a antecedência (0 para pronta-entrega)." })
      .int("Use dias inteiros.")
      .min(0, "A antecedência não pode ser negativa.")
      .max(60, "Use no máximo 60 dias."),
    ingredients: z.string().trim().max(1000, "Use no máximo 1000 caracteres."),
    allergens: z.array(z.enum(ALLERGENS)),
    mayContainTraces: z.boolean(),
    variants: z.array(variantSchema).min(1, "Adicione pelo menos uma variante."),
  })
  .refine(
    (data) =>
      new Set(data.variants.map((v) => v.label.trim().toLowerCase())).size ===
      data.variants.length,
    { message: "Os nomes das variantes devem ser únicos.", path: ["variants"] },
  );

export type ProductInput = z.infer<typeof productSchema>;
