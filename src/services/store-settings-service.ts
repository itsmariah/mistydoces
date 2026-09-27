import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { buildStoreContact } from "@/lib/store-contact";
import type { StoreSettingsInput } from "@/validations/store-settings";

const SETTINGS_ID = "singleton";

/** `cache`: rodapé, página e checkout pedem as configurações na mesma requisição — uma consulta só. */
export const getStoreSettings = cache(() =>
  prisma.storeSettings.findUnique({ where: { id: SETTINGS_ID } }),
);

export async function getDeliveryFee(): Promise<number> {
  const settings = await getStoreSettings();
  return settings ? Number(settings.deliveryFee) : 0;
}

/** Contato, endereço de retirada e horário, com os links prontos para a loja exibir. */
export async function getStoreContact() {
  return buildStoreContact(await getStoreSettings());
}

export function upsertStoreSettings(input: StoreSettingsInput) {
  return prisma.storeSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, ...input },
    update: input,
  });
}
