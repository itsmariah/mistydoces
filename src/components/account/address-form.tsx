"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAddress, updateAddress } from "@/actions/addresses";
import { addressSchema, type AddressInput } from "@/validations/order";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddressForm({
  addressId,
  defaultValues,
  onSuccess,
  onCancel,
}: {
  addressId?: string;
  defaultValues?: AddressInput;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues,
  });

  function onSubmit(data: AddressInput) {
    setFormError(null);
    startTransition(async () => {
      const result = addressId
        ? await updateAddress(addressId, data)
        : await createAddress(data);

      if (!result.success) {
        setFormError(result.error.message);
        return;
      }
      onSuccess();
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-2 gap-4 rounded-lg border border-border p-4"
      noValidate
    >
      <div className="col-span-2 space-y-1.5">
        <Label htmlFor="label">Nome do endereço</Label>
        <Input id="label" placeholder="Casa, trabalho..." {...register("label")} />
        {errors.label && <p className="text-sm text-destructive">{errors.label.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="zipCode">CEP</Label>
        <Input id="zipCode" {...register("zipCode")} />
        {errors.zipCode && <p className="text-sm text-destructive">{errors.zipCode.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="number">Número</Label>
        <Input id="number" {...register("number")} />
        {errors.number && <p className="text-sm text-destructive">{errors.number.message}</p>}
      </div>
      <div className="col-span-2 space-y-1.5">
        <Label htmlFor="street">Rua</Label>
        <Input id="street" {...register("street")} />
        {errors.street && <p className="text-sm text-destructive">{errors.street.message}</p>}
      </div>
      <div className="col-span-2 space-y-1.5">
        <Label htmlFor="complement">Complemento (opcional)</Label>
        <Input id="complement" {...register("complement")} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="neighborhood">Bairro</Label>
        <Input id="neighborhood" {...register("neighborhood")} />
        {errors.neighborhood && (
          <p className="text-sm text-destructive">{errors.neighborhood.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="city">Cidade</Label>
        <Input id="city" {...register("city")} />
        {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="state">UF</Label>
        <Input id="state" maxLength={2} {...register("state")} />
        {errors.state && <p className="text-sm text-destructive">{errors.state.message}</p>}
      </div>
      <div className="col-span-2 space-y-1.5">
        <Label htmlFor="reference">Ponto de referência (opcional)</Label>
        <Input id="reference" {...register("reference")} />
      </div>

      {formError && <p className="col-span-2 text-sm text-destructive">{formError}</p>}

      <div className="col-span-2 flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar endereço"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
