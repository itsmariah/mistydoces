"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { listCategoriesAdmin } from "@/services/category-service";
import { deleteCategory } from "@/actions/categories";
import { CategoryForm } from "@/components/admin/category-form";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Category = Awaited<ReturnType<typeof listCategoriesAdmin>>[number];

export function CategoryList({
  categories,
  canEdit,
  canDelete,
}: {
  categories: Category[];
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);

  function refreshAndClose() {
    setEditingId(null);
    setAddingNew(false);
    router.refresh();
  }

  async function handleDelete(category: Category) {
    const result = await deleteCategory(category.id);
    if (!result.success) {
      toast.error(result.error.message);
      return;
    }
    toast.success(`Categoria "${category.name}" excluída.`);
    router.refresh();
  }

  if (categories.length === 0 && !addingNew) {
    return (
      <EmptyState
        image={{ src: "/branding/04_laco_lilas.png", width: 106, height: 92 }}
        title="Nenhuma categoria ainda"
        description="As categorias organizam o cardápio, como Brigadeiros ou Bolos."
        action={
          canEdit && <Button onClick={() => setAddingNew(true)}>Adicionar categoria</Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
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

            {(canEdit || canDelete) && (
              <div className="flex gap-2">
                {canEdit && (
                  <Button variant="outline" size="sm" onClick={() => setEditingId(category.id)}>
                    Editar
                  </Button>
                )}
                {canDelete && (
                  <ConfirmDialog
                    trigger={
                      <Button variant="destructive" size="sm">
                        Excluir
                      </Button>
                    }
                    title={`Excluir a categoria "${category.name}"?`}
                    description="Essa ação não pode ser desfeita."
                    confirmLabel="Excluir"
                    destructive
                    onConfirm={() => handleDelete(category)}
                  />
                )}
              </div>
            )}
          </div>
        ),
      )}

      {canEdit &&
        (addingNew ? (
          <CategoryForm onSuccess={refreshAndClose} onCancel={() => setAddingNew(false)} />
        ) : (
          <Button variant="outline" onClick={() => setAddingNew(true)}>
            Adicionar categoria
          </Button>
        ))}
    </div>
  );
}
