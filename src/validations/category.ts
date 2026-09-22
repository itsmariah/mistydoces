import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da categoria."),
  isActive: z.boolean(),
});

export type CategoryInput = z.infer<typeof categorySchema>;
