import { requirePagePermission } from "@/lib/require-permission";
import { listCategoriesAdmin } from "@/services/category-service";
import { ProductForm } from "@/components/admin/product-form";

export default async function NewProductPage() {
  await requirePagePermission("products:edit");
  const categories = await listCategoriesAdmin();

  return (
    <div className="px-4 py-12">
      <h1 className="mb-8 font-heading text-2xl font-semibold">Novo produto</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
