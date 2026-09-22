"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { listCategoriesAdmin } from "@/services/category-service";
import { deleteCategory } from "@/actions/categories";
import { CategoryForm } from "@/components/admin/category-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Category = Awaited<ReturnType<typeof listCategoriesAdmin>>[number];

export function CategoryList({ categories }: { categories: Category[] }) {
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

  function handleDelete(categoryId: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteCategory(categoryId);
      if (!result.success) {
        setError(result.error.message);
        setConfirmingDeleteId(null);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-destructive">{error}</p>}

      {categories.map((category) =>
        editingId === category.id ? (
          <CategoryForm
            key={category.id}
            categoryId={category.id}
            defaultValues={{ name: category.name, isActive: category.isActive }}
            onSuccess={refreshAndClose}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <div
            key={category.id}
            className="flex items-center justify-between rounded-lg border border-border p-4"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">{category.name}</span>
              {!category.isActive && <Badge variant="outline">Inativa</Badge>}
              <span className="text-sm text-muted-foreground">
                {category._count.products} produto(s)
              </span>
            </div>

            {confirmingDeleteId === category.id ? (
              <div className="flex items-center gap-2">
                <span className="text-sm">Excluir?</span>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleDelete(category.id)}
                >
                  Sim
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
                <Button variant="outline" size="sm" onClick={() => setEditingId(category.id)}>
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirmingDeleteId(category.id)}
                >
                  Excluir
                </Button>
              </div>
            )}
          </div>
        ),
      )}

      {addingNew ? (
        <CategoryForm onSuccess={refreshAndClose} onCancel={() => setAddingNew(false)} />
      ) : (
        <Button variant="outline" onClick={() => setAddingNew(true)}>
          Adicionar categoria
        </Button>
      )}
    </div>
  );
}
