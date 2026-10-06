"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { createProduct, updateProduct } from "@/actions/products";
import { productSchema, type ProductInput } from "@/validations/product";
import { ALLERGENS, ALLERGEN_LABELS } from "@/lib/allergens";
import { ProductImagesField } from "@/components/admin/product-images-field";
import { SectionCard } from "@/components/shared/section-card";
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
  readOnly = false,
}: {
  productId?: string;
  defaultValues?: ProductInput;
  categories: { id: string; name: string }[];
  /** Quem só pode ver produtos: campos desabilitados, sem salvar nem mexer nas variantes. */
  readOnly?: boolean;
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
      images: [],
      isAvailable: true,
      isActive: true,
      leadTimeDays: 0,
      ingredients: "",
      allergens: [],
      mayContainTraces: false,
      allowsNote: false,
      notePrompt: "",
      variants: [{ label: "Único", price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "variants" });
  const allowsNote = useWatch({ control, name: "allowsNote" });

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
      toast.success(productId ? "Produto atualizado." : "Produto criado.");
      router.push("/admin/produtos");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl" noValidate>
      {/* fieldset desabilitado cobre os inputs nativos; Select e Checkbox recebem `disabled` à parte. */}
      <fieldset disabled={readOnly} className="min-w-0 space-y-6">
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
              <Select value={field.value} onValueChange={field.onChange} disabled={readOnly}>
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
          name="images"
          render={({ field }) => (
            <ProductImagesField value={field.value} onChange={field.onChange} disabled={readOnly} />
          )}
        />

        <div className="flex gap-6">
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <Label className="flex items-center gap-2">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={readOnly}
                />
                Ativo no cardápio
              </Label>
            )}
          />
          <Controller
            control={control}
            name="isAvailable"
            render={({ field }) => (
              <Label className="flex items-center gap-2">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={readOnly}
                />
                Disponível (em estoque)
              </Label>
            )}
          />
        </div>

        <div className="max-w-60 space-y-1.5">
          <Label htmlFor="leadTimeDays">Antecedência mínima (dias)</Label>
          <Input
            id="leadTimeDays"
            type="number"
            min="0"
            disabled={readOnly}
            aria-invalid={Boolean(errors.leadTimeDays)}
            {...register("leadTimeDays", { valueAsNumber: true })}
          />
          {errors.leadTimeDays ? (
            <p className="text-sm text-destructive">{errors.leadTimeDays.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              0 = pronta-entrega. Com 2, o cliente só agenda a partir de depois de amanhã.
            </p>
          )}
        </div>

        <SectionCard as="fieldset" title="Ingredientes e alérgenos" disabled={readOnly} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ingredients">Ingredientes</Label>
            <Textarea
              id="ingredients"
              rows={3}
              placeholder="Leite condensado, chocolate 50% cacau, manteiga, granulado"
              aria-invalid={Boolean(errors.ingredients)}
              {...register("ingredients")}
            />
            {errors.ingredients ? (
              <p className="text-sm text-destructive">{errors.ingredients.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Com os ingredientes preenchidos, o produto passa a aparecer nos filtros
                &ldquo;Sem glúten&rdquo;, &ldquo;Sem lactose&rdquo; e &ldquo;Sem ovos&rdquo; quando
                não tiver esses alérgenos marcados.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Contém</p>
            <Controller
              control={control}
              name="allergens"
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {ALLERGENS.map((allergen) => (
                    <Label key={allergen} className="flex items-center gap-2 font-normal">
                      <Checkbox
                        checked={field.value.includes(allergen)}
                        onCheckedChange={(checked) =>
                          field.onChange(
                            checked
                              ? [...field.value, allergen]
                              : field.value.filter((item) => item !== allergen),
                          )
                        }
                      />
                      {ALLERGEN_LABELS[allergen]}
                    </Label>
                  ))}
                </div>
              )}
            />
          </div>

          <Controller
            control={control}
            name="mayContainTraces"
            render={({ field }) => (
              <Label className="flex items-center gap-2 font-normal">
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                Pode conter traços de outros alérgenos (cozinha compartilhada)
              </Label>
            )}
          />
        </SectionCard>

        <SectionCard as="fieldset" title="Personalização" disabled={readOnly} className="space-y-3">
          <Controller
            control={control}
            name="allowsNote"
            render={({ field }) => (
              <Label className="flex items-center gap-2 font-normal">
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                Cliente pode escrever um texto para este item (grátis)
              </Label>
            )}
          />
          {allowsNote && (
            <div className="space-y-1.5">
              <Label htmlFor="notePrompt">Pergunta do campo</Label>
              <Input
                id="notePrompt"
                placeholder="Nome ou frase para escrever no bolo"
                aria-invalid={Boolean(errors.notePrompt)}
                {...register("notePrompt")}
              />
              {errors.notePrompt ? (
                <p className="text-sm text-destructive">{errors.notePrompt.message}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Aparece na página do produto. Em branco, fica &ldquo;Personalização&rdquo;.
                </p>
              )}
            </div>
          )}
        </SectionCard>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Variantes / formatos</Label>
            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ label: "", price: 0 })}
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar variante
              </Button>
            )}
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
              {!readOnly && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  disabled={fields.length === 1}
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {formError && <p className="text-sm text-destructive">{formError}</p>}

        {!readOnly && (
          <Button type="submit" disabled={isPending}>
            {isPending ? "Salvando…" : "Salvar produto"}
          </Button>
        )}
      </fieldset>
    </form>
  );
}
