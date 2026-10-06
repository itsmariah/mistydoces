"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ExpenseCategory } from "@/generated/prisma/client";
import { deleteExpense } from "@/actions/expenses";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { ExpenseForm } from "@/components/admin/finance/expense-form";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/finance";
import { formatCurrency } from "@/lib/utils";

export type ExpenseRow = {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  createdByName: string | null;
};

/** "2026-10-06" -> "06/10" (a chave já está no fuso da loja, não passa por Date). */
function formatDay(day: string): string {
  const [, month, date] = day.split("-");
  return `${date}/${month}`;
}

export function ExpenseList({
  expenses,
  defaultDate,
  monthLabel,
}: {
  expenses: ExpenseRow[];
  /** Data sugerida para uma despesa nova: hoje no mês atual, o dia 1 nos outros meses. */
  defaultDate: string;
  monthLabel: string;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);

  function refreshAndClose() {
    setEditingId(null);
    setAddingNew(false);
    router.refresh();
  }

  async function handleDelete(expense: ExpenseRow) {
    const result = await deleteExpense(expense.id);
    if (!result.success) {
      toast.error(result.error.message);
      return;
    }
    toast.success(`Despesa "${expense.title}" excluída.`);
    router.refresh();
  }

  const newExpenseForm = (
    <ExpenseForm
      defaultValues={{ title: "", category: "MATERIAL", date: defaultDate }}
      onSuccess={refreshAndClose}
      onCancel={() => setAddingNew(false)}
    />
  );

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold">Despesas</h2>
        {!addingNew && expenses.length > 0 && (
          <Button size="sm" onClick={() => setAddingNew(true)}>
            <Plus />
            Nova despesa
          </Button>
        )}
      </div>

      {addingNew && newExpenseForm}

      {expenses.length === 0 && !addingNew ? (
        <EmptyState
          className="rounded-lg border border-dashed border-border"
          image={{ src: "/branding/14_pote_de_biscoitos.png", width: 110, height: 110 }}
          title="Nenhuma despesa"
          description={`Cadastre o que foi gasto em ${monthLabel} (materiais, embalagens…) para comparar com o faturamento.`}
          action={<Button onClick={() => setAddingNew(true)}>Cadastrar despesa</Button>}
        />
      ) : (
        <ul className="space-y-2">
          {expenses.map((expense) =>
            editingId === expense.id ? (
              <li key={expense.id}>
                <ExpenseForm
                  expenseId={expense.id}
                  defaultValues={{
                    title: expense.title,
                    category: expense.category,
                    amount: expense.amount,
                    date: expense.date,
                  }}
                  onSuccess={refreshAndClose}
                  onCancel={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li
                key={expense.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate font-medium">{expense.title}</p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <Badge variant="outline">{EXPENSE_CATEGORY_LABELS[expense.category]}</Badge>
                    <span className="tabular-nums">{formatDay(expense.date)}</span>
                    {expense.createdByName && <span>· por {expense.createdByName}</span>}
                  </div>
                </div>
                <span className="font-medium tabular-nums">{formatCurrency(expense.amount)}</span>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Editar ${expense.title}`}
                    onClick={() => setEditingId(expense.id)}
                  >
                    <Pencil />
                  </Button>
                  <ConfirmDialog
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Excluir ${expense.title}`}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 />
                      </Button>
                    }
                    title={`Excluir a despesa "${expense.title}"?`}
                    description="Ela sai do total do mês. Essa ação não pode ser desfeita."
                    confirmLabel="Excluir"
                    destructive
                    onConfirm={() => handleDelete(expense)}
                  />
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </section>
  );
}
