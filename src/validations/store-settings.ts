import { z } from "zod";

export const storeSettingsSchema = z.object({
  storeName: z.string().trim().min(2, "Informe o nome da loja."),
  deliveryFee: z.number().min(0, "A taxa não pode ser negativa."),
});

export type StoreSettingsInput = z.infer<typeof storeSettingsSchema>;
