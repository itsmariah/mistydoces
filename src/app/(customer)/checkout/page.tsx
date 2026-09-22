import { auth } from "@/lib/auth";
import { getUserAddresses } from "@/services/address-service";
import { getDeliveryFee } from "@/services/store-settings-service";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export default async function CheckoutPage() {
  // A rota já é protegida pelo proxy (RN02); aqui buscamos os dados do usuário.
  const session = await auth();
  const [addresses, deliveryFee] = await Promise.all([
    getUserAddresses(session!.user.id),
    getDeliveryFee(),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-8 font-heading text-2xl font-semibold">Finalizar pedido</h1>
      <CheckoutForm addresses={addresses} deliveryFee={deliveryFee} />
    </div>
  );
}
