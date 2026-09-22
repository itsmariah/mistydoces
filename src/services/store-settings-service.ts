import { prisma } from "@/lib/prisma";
import type { StoreSettingsInput } from "@/validations/store-settings";

const SETTINGS_ID = "singleton";

export function getStoreSettings() {
  return prisma.storeSettings.findUnique({ where: { id: SETTINGS_ID } });
}

export async function getDeliveryFee(): Promise<number> {
  const settings = await getStoreSettings();
  return settings ? Number(settings.deliveryFee) : 0;
}

export function upsertStoreSettings(input: StoreSettingsInput) {
  return prisma.storeSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, ...input },
    update: input,
  });
}
