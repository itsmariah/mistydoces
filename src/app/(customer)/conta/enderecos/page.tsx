import Link from "next/link";
import { auth } from "@/lib/auth";
import { getUserAddresses } from "@/services/address-service";
import { AddressList } from "@/components/account/address-list";

export default async function AddressesPage() {
  const session = await auth();
  const addresses = await getUserAddresses(session!.user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <div>
        <Link href="/conta" className="text-sm text-muted-foreground hover:text-foreground">
          ← Minha conta
        </Link>
      </div>

      <h1 className="font-heading text-2xl font-semibold">Meus endereços</h1>

      <AddressList addresses={addresses} />
    </div>
  );
}
