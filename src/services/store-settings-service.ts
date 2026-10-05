import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { buildStoreContact } from "@/lib/store-contact";
import { parseBlockedDates, parseWeeklyHours } from "@/lib/store-hours";
import {
  DEFAULT_MAX_ADVANCE_DAYS,
  DEFAULT_PREP_MINUTES,
  type SchedulingRules,
} from "@/lib/scheduling";
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

/** Horário, folgas, preparo e limite de agendamento — as regras das janelas do checkout. */
export async function getSchedulingRules(): Promise<SchedulingRules> {
  const settings = await getStoreSettings();
  return {
    weeklyHours: parseWeeklyHours(settings?.weeklyHours ?? null),
    blockedDates: parseBlockedDates(settings?.blockedDates ?? []),
    prepMinutes: settings?.prepMinutes ?? DEFAULT_PREP_MINUTES,
    maxAdvanceDays: settings?.maxAdvanceDays ?? DEFAULT_MAX_ADVANCE_DAYS,
  };
}

export function upsertStoreSettings(input: StoreSettingsInput) {
  return prisma.storeSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, ...input },
    update: input,
  });
}
