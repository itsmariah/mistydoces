"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { createProduct, updateProduct } from "@/actions/products";
import { productSchema, type ProductInput } from "@/validations/product";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ProductForm({
  productId,
  defaultValues,
  categories,
}: {
  productId?: string;
  defaultValues?: ProductInput;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: defaultValues ?? {
      name: "",
      description: "",
      categoryId: categories[0]?.id ?? "",
      imageUrl: "",
      isAvailable: true,
      isActive: true,
      variants: [{ label: "Único", price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "variants" });

  function onSubmit(data: ProductInput) {
    setFormError(null);
    startTransition(async () => {
      const result = productId
        ? await updateProduct(productId, data)
        : await createProduct(data);

      if (!result.success) {
        setFormError(result.error.message);
        return;
      }
      router.push("/admin/produtos");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" {...register("description")} />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="categoryId">Categoria</Label>
        <Controller
          control={control}
          name="categoryId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="categoryId" className="w-full">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.categoryId && (
          <p className="text-sm text-destructive">{errors.categoryId.message}</p>
        )}
      </div>

      <Controller
        control={control}
        name="imageUrl"
        render={({ field }) => (
          <ImageUploadField value={field.value} onChange={field.onChange} />
        )}
      />

      <div className="flex gap-6">
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <Label className="flex items-center gap-2">
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              Ativo no cardápio
            </Label>
          )}
        />
        <Controller
          control={control}
          name="isAvailable"
          render={({ field }) => (
            <Label className="flex items-center gap-2">
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              Disponível (em estoque)
            </Label>
          )}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Variantes / formatos</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ label: "", price: 0 })}
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar variante
          </Button>
        </div>

        {errors.variants?.message && (
          <p className="text-sm text-destructive">{errors.variants.message}</p>
        )}

        {fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-2">
            <div className="flex-1 space-y-1">
              <Input
                placeholder="Nome (ex.: Caixa com 6)"
                {...register(`variants.${index}.label`)}
              />
              {errors.variants?.[index]?.label && (
                <p className="text-sm text-destructive">
                  {errors.variants[index]?.label?.message}
                </p>
              )}
            </div>
            <div className="w-32 space-y-1">
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Preço"
                {...register(`variants.${index}.price`, { valueAsNumber: true })}
              />
              {errors.variants?.[index]?.price && (
                <p className="text-sm text-destructive">
                  {errors.variants[index]?.price?.message}
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              disabled={fields.length === 1}
              onClick={() => remove(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar produto"}
      </Button>
    </form>
  );
}
