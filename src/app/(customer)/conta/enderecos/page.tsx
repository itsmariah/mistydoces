import { auth } from "@/lib/auth";
import { getUserAddresses } from "@/services/address-service";
import { AddressList } from "@/components/account/address-list";

export default async function AddressesPage() {
  const session = await auth();
  const addresses = await getUserAddresses(session!.user.id);

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-xl font-semibold">Meus endereços</h1>

      <AddressList addresses={addresses} />
    </div>
  );
}
