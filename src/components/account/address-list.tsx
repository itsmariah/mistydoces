"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Address } from "@/generated/prisma/client";
import { deleteAddress, setDefaultAddress } from "@/actions/addresses";
import { AddressForm } from "@/components/account/address-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function AddressList({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function refreshAndClose() {
    setEditingId(null);
    setAddingNew(false);
    router.refresh();
  }

  function handleDelete(addressId: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteAddress(addressId);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setConfirmingDeleteId(null);
      router.refresh();
    });
  }

  function handleSetDefault(addressId: string) {
    setError(null);
    startTransition(async () => {
      const result = await setDefaultAddress(addressId);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}

      {addresses.map((address) =>
        editingId === address.id ? (
          <AddressForm
            key={address.id}
            addressId={address.id}
            defaultValues={{
              label: address.label,
              zipCode: address.zipCode,
              street: address.street,
              number: address.number,
              complement: address.complement ?? "",
              neighborhood: address.neighborhood,
              city: address.city,
              state: address.state,
              reference: address.reference ?? "",
            }}
            onSuccess={refreshAndClose}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <div key={address.id} className="space-y-2 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium">
                {address.label}
                {address.isDefault && <Badge>Padrão</Badge>}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {address.street}, {address.number}
              {address.complement ? `, ${address.complement}` : ""} — {address.neighborhood},{" "}
              {address.city}/{address.state} — CEP {address.zipCode}
            </p>

            {confirmingDeleteId === address.id ? (
              <div className="flex items-center gap-2">
                <span className="text-sm">Excluir este endereço?</span>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleDelete(address.id)}
                >
                  Sim, excluir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => setConfirmingDeleteId(null)}
                >
                  Voltar
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditingId(address.id)}>
                  Editar
                </Button>
                {!address.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleSetDefault(address.id)}
                  >
                    Definir como padrão
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirmingDeleteId(address.id)}
                >
                  Excluir
                </Button>
              </div>
            )}
          </div>
        ),
      )}

      {addingNew ? (
        <AddressForm onSuccess={refreshAndClose} onCancel={() => setAddingNew(false)} />
      ) : (
        <Button variant="outline" onClick={() => setAddingNew(true)}>
          Adicionar endereço
        </Button>
      )}
    </div>
  );
}
