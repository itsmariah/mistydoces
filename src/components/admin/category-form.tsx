"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCategory, updateCategory } from "@/actions/categories";
import { categorySchema, type CategoryInput } from "@/validations/category";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CategoryForm({
  categoryId,
  defaultValues,
  onSuccess,
  onCancel,
}: {
  categoryId?: string;
  defaultValues?: CategoryInput;
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
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: defaultValues ?? { name: "", isActive: true },
  });

  function onSubmit(data: CategoryInput) {
    setFormError(null);
    startTransition(async () => {
      const result = categoryId
        ? await updateCategory(categoryId, data)
        : await createCategory(data);

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
      className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-4"
      noValidate
    >
      <div className="min-w-48 flex-1 space-y-1.5">
        <Label htmlFor="name">Nome da categoria</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <Controller
        control={control}
        name="isActive"
        render={({ field }) => (
          <Label className="flex items-center gap-2 pb-1.5">
            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            Ativa no cardápio
          </Label>
        )}
      />

      {formError && <p className="w-full text-sm text-destructive">{formError}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
