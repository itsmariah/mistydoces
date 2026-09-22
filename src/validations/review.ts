import { z } from "zod";

export const reviewSchema = z.object({
  rating: z.number().int().min(1, "Escolha de 1 a 5 estrelas.").max(5),
  comment: z.string().trim().max(1000).optional(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
