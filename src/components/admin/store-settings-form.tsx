"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateStoreSettings } from "@/actions/store-settings";
import {
  storeSettingsSchema,
  type StoreSettingsInput,
} from "@/validations/store-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function StoreSettingsForm({
  defaultValues,
}: {
  defaultValues: StoreSettingsInput;
}) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StoreSettingsInput>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues,
  });

  function onSubmit(data: StoreSettingsInput) {
    setFormError(null);
    startTransition(async () => {
      const result = await updateStoreSettings(data);
      if (!result.success) {
        setFormError(result.error.message);
        return;
      }
      toast.success("Configurações salvas.");
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="storeName">Nome da loja</Label>
        <Input id="storeName" {...register("storeName")} />
        {errors.storeName && (
          <p className="text-sm text-destructive">{errors.storeName.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="deliveryFee">Taxa de entrega (R$)</Label>
        <Input
          id="deliveryFee"
          type="number"
          step="0.01"
          min="0"
          {...register("deliveryFee", { valueAsNumber: true })}
        />
        {errors.deliveryFee && (
          <p className="text-sm text-destructive">{errors.deliveryFee.message}</p>
        )}
      </div>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar alterações"}
      </Button>
    </form>
  );
}
