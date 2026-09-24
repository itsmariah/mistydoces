import { z } from "zod";

export const addressSchema = z.object({
  label: z.string().trim().min(2, "Dê um nome para este endereço (ex.: Casa)."),
  zipCode: z.string().trim().min(8, "Informe um CEP válido."),
  street: z.string().trim().min(2, "Informe a rua."),
  number: z.string().trim().min(1, "Informe o número."),
  complement: z.string().trim().min(1, "Informe o complemento."),
  neighborhood: z.string().trim().min(2, "Informe o bairro."),
  city: z.string().trim().min(2, "Informe a cidade."),
  state: z.string().trim().length(2, "Use a sigla do estado (ex.: SP)."),
  reference: z.string().trim().min(1, "Informe um ponto de referência."),
});

export type AddressInput = z.infer<typeof addressSchema>;

/** Limite por item do carrinho — o client usa o mesmo valor para não deixar passar do que o checkout aceita. */
export const MAX_ITEM_QUANTITY = 50;

const cartItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(MAX_ITEM_QUANTITY),
});

const checkoutBaseSchema = z.object({
  items: z.array(cartItemSchema).min(1, "Seu carrinho está vazio."),
  deliveryType: z.enum(["DELIVERY", "PICKUP"]),
  addressId: z.string().min(1).optional(),
  newAddress: addressSchema.optional(),
  paymentMethod: z.enum(["CASH", "PIX_MANUAL", "CARD_ON_DELIVERY", "PIX_ONLINE", "CARD_ONLINE"]),
  notes: z.string().trim().max(500).optional(),
  couponCode: z.string().trim().min(1).optional(),
});

function requiresAddress(data: {
  deliveryType: "DELIVERY" | "PICKUP";
  addressId?: string;
  newAddress?: AddressInput;
}) {
  return data.deliveryType !== "DELIVERY" || Boolean(data.addressId || data.newAddress);
}

export const checkoutSchema = checkoutBaseSchema.refine(requiresAddress, {
  message: "Selecione ou cadastre um endereço de entrega.",
  path: ["addressId"],
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

// Versão usada pelo formulário no client: não inclui `items` (vêm do carrinho,
// não de um campo editável) e mantém `newAddress` livre de validação — os
// campos do endereço novo só são obrigatórios quando o usuário opta por eles,
// o que é checado manualmente no submit (ver CheckoutForm).
export const checkoutFormSchema = checkoutBaseSchema
  .omit({ items: true, newAddress: true })
  .extend({ newAddress: addressSchema.partial() });

export type CheckoutFormInput = z.infer<typeof checkoutFormSchema>;
