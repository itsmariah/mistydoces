import { notFound } from "next/navigation";
import { getProductByIdAdmin } from "@/services/product-service";
import { listCategoriesAdmin } from "@/services/category-service";
import { AppError } from "@/lib/errors";
import { ProductForm } from "@/components/admin/product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, categories] = await Promise.all([
    getProductByIdAdmin(id).catch((error) => {
      if (error instanceof AppError) notFound();
      throw error;
    }),
    listCategoriesAdmin(),
  ]);

  return (
    <div className="px-4 py-12">
      <h1 className="mb-8 font-heading text-2xl font-semibold">Editar produto</h1>
      <ProductForm
        productId={product.id}
        categories={categories}
        defaultValues={{
          name: product.name,
          description: product.description,
          categoryId: product.categoryId,
          imageUrl: product.imageUrl ?? "",
          isAvailable: product.isAvailable,
          isActive: product.isActive,
          variants: product.variants.map((variant) => ({
            id: variant.id,
            label: variant.label,
            price: Number(variant.price),
          })),
        }}
      />
    </div>
  );
}
