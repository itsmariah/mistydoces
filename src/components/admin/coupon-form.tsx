"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCoupon, updateCoupon } from "@/actions/coupons";
import { couponSchema, type CouponInput } from "@/validations/coupon";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CouponForm({
  couponId,
  defaultValues,
  onSuccess,
  onCancel,
}: {
  couponId?: string;
  defaultValues?: CouponInput;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CouponInput>({
    resolver: zodResolver(couponSchema),
    defaultValues: defaultValues ?? {
      code: "",
      type: "PERCENTAGE",
      value: 10,
      isActive: true,
    },
  });

  function onSubmit(data: CouponInput) {
    setFormError(null);
    startTransition(async () => {
      const result = couponId
        ? await updateCoupon(couponId, data)
        : await createCoupon(data);

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
      <div className="space-y-1.5">
        <Label htmlFor="code">Código</Label>
        <Input id="code" placeholder="PROMO10" {...register("code")} />
        {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="type">Tipo</Label>
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERCENTAGE">Percentual (%)</SelectItem>
                <SelectItem value="FIXED">Valor fixo (R$)</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="value">Valor</Label>
        <Input
          id="value"
          type="number"
          step="0.01"
          min="0"
          {...register("value", { valueAsNumber: true })}
        />
        {errors.value && <p className="text-sm text-destructive">{errors.value.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="minOrderValue">Pedido mínimo (opcional)</Label>
        <Input
          id="minOrderValue"
          type="number"
          step="0.01"
          min="0"
          {...register("minOrderValue", {
            setValueAs: (v) => (v === "" ? undefined : Number(v)),
          })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="maxUses">Limite de usos (opcional)</Label>
        <Input
          id="maxUses"
          type="number"
          step="1"
          min="1"
          {...register("maxUses", {
            setValueAs: (v) => (v === "" ? undefined : Number(v)),
          })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="expiresAt">Validade (opcional)</Label>
        <Input id="expiresAt" type="date" {...register("expiresAt")} />
      </div>

      <Controller
        control={control}
        name="isActive"
        render={({ field }) => (
          <Label className="flex items-center gap-2 pb-1.5">
            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            Ativo
          </Label>
        )}
      />

      {formError && <p className="col-span-2 text-sm text-destructive">{formError}</p>}

      <div className="col-span-2 flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar cupom"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
