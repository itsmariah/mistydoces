"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createExpense, updateExpense } from "@/actions/expenses";
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS } from "@/lib/finance";
import { expenseSchema, type ExpenseData, type ExpenseInput } from "@/validations/expense";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ExpenseForm({
  expenseId,
  defaultValues,
  onSuccess,
  onCancel,
}: {
  expenseId?: string;
  /** O valor começa vazio numa despesa nova. */
  defaultValues: Partial<ExpenseInput>;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const fieldId = (name: string) => `${expenseId ?? "nova"}-${name}`;

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExpenseInput, unknown, ExpenseData>({
    resolver: zodResolver(expenseSchema),
    defaultValues,
  });

  function onSubmit(data: ExpenseData) {
    setFormError(null);
    startTransition(async () => {
      const result = expenseId ? await updateExpense(expenseId, data) : await createExpense(data);

      if (!result.success) {
        setFormError(result.error.message);
        return;
      }
      toast.success(expenseId ? "Despesa atualizada." : "Despesa cadastrada.");
      onSuccess();
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-2"
      noValidate
    >
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor={fieldId("title")}>Título</Label>
        <Input
          id={fieldId("title")}
          placeholder="Chocolates"
          autoFocus
          aria-invalid={!!errors.title}
          {...register("title")}
        />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={fieldId("category")}>Categoria</Label>
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <Select items={EXPENSE_CATEGORY_LABELS} value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id={fieldId("category")} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {EXPENSE_CATEGORY_LABELS[category]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={fieldId("amount")}>Valor (R$)</Label>
        <Input
          id={fieldId("amount")}
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="75,00"
          aria-invalid={!!errors.amount}
          {...register("amount", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
        />
        {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={fieldId("date")}>Data</Label>
        <Input
          id={fieldId("date")}
          type="date"
          aria-invalid={!!errors.date}
          {...register("date")}
        />
        {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
      </div>

      {formError && <p className="text-sm text-destructive sm:col-span-2">{formError}</p>}

      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando…" : "Salvar despesa"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
