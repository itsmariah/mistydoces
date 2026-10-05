import { requirePagePermission } from "@/lib/require-permission";
import { getStoreSettings } from "@/services/store-settings-service";
import { StoreSettingsForm } from "@/components/admin/store-settings-form";
import { DEFAULT_STORE_NAME } from "@/lib/store-contact";
import { parseBlockedDates, parseWeeklyHours } from "@/lib/store-hours";
import { weeklyHoursToForm } from "@/validations/store-settings";
import { DEFAULT_MAX_ADVANCE_DAYS, DEFAULT_PREP_MINUTES } from "@/lib/scheduling";

export default async function AdminSettingsPage() {
  await requirePagePermission("settings:manage");
  const settings = await getStoreSettings();

  return (
    <div className="px-4 py-12">
      <h1 className="mb-8 font-heading text-2xl font-semibold">Configurações da loja</h1>
      <StoreSettingsForm
        defaultValues={{
          storeName: settings?.storeName ?? DEFAULT_STORE_NAME,
          description: settings?.description ?? "",
          whatsapp: settings?.whatsapp ?? "",
          phone: settings?.phone ?? "",
          email: settings?.email ?? "",
          instagram: settings?.instagram ?? "",
          street: settings?.street ?? "",
          city: settings?.city ?? "",
          state: settings?.state ?? "",
          zipCode: settings?.zipCode ?? "",
          // Sem nada salvo, o form já vem com o padrão (seg a sáb, 13h às 21h).
          weeklyHours: weeklyHoursToForm(parseWeeklyHours(settings?.weeklyHours ?? null)),
          hoursNote: settings?.hoursNote ?? "",
          prepMinutes: settings?.prepMinutes ?? DEFAULT_PREP_MINUTES,
          maxAdvanceDays: settings?.maxAdvanceDays ?? DEFAULT_MAX_ADVANCE_DAYS,
          blockedDates: parseBlockedDates(settings?.blockedDates ?? []),
          deliveryFee: settings ? Number(settings.deliveryFee) : 0,
        }}
      />
    </div>
  );
}
