import { can } from "@/lib/permissions";
import { requirePagePermission } from "@/lib/require-permission";
import { listCategoriesAdmin } from "@/services/category-service";
import { CategoryList } from "@/components/admin/category-list";

export default async function AdminCategoriesPage() {
  const user = await requirePagePermission("categories:view");
  const categories = await listCategoriesAdmin();

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <h1 className="font-heading text-2xl font-semibold">Categorias</h1>
      <CategoryList
        categories={categories}
        canEdit={can(user.role, "categories:edit")}
        canDelete={can(user.role, "categories:delete")}
      />
    </div>
  );
}
