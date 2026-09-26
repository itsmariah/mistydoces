import { requirePagePermission } from "@/lib/require-permission";
import { getStoreSettings } from "@/services/store-settings-service";
import { StoreSettingsForm } from "@/components/admin/store-settings-form";

export default async function AdminSettingsPage() {
  await requirePagePermission("settings:manage");
  const settings = await getStoreSettings();

  return (
    <div className="px-4 py-12">
      <h1 className="mb-8 font-heading text-2xl font-semibold">Configurações da loja</h1>
      <StoreSettingsForm
        defaultValues={{
          storeName: settings?.storeName ?? "",
          deliveryFee: settings ? Number(settings.deliveryFee) : 0,
        }}
      />
    </div>
  );
}
