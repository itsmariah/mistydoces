import { prisma } from "@/lib/prisma";
import { AppError, NotFoundError } from "@/lib/errors";
import { slugify } from "@/lib/utils";
import type { CategoryInput } from "@/validations/category";

export function listCategoriesAdmin() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
}

async function uniqueSlug(name: string, ignoreId?: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let suffix = 1;

  while (true) {
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (!existing || existing.id === ignoreId) return slug;
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}

export async function createCategory(input: CategoryInput) {
  const slug = await uniqueSlug(input.name);
  return prisma.category.create({
    data: { name: input.name, slug, isActive: input.isActive },
  });
}

export async function updateCategory(categoryId: string, input: CategoryInput) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) throw new NotFoundError("Categoria não encontrada.");

  const slug =
    category.name === input.name ? category.slug : await uniqueSlug(input.name, categoryId);

  return prisma.category.update({
    where: { id: categoryId },
    data: { name: input.name, slug, isActive: input.isActive },
  });
}

export async function deleteCategory(categoryId: string) {
  const productCount = await prisma.product.count({ where: { categoryId } });
  if (productCount > 0) {
    throw new AppError(
      "CATEGORY_HAS_PRODUCTS",
      "Não é possível excluir uma categoria com produtos. Mova ou remova os produtos primeiro.",
      409,
    );
  }
  await prisma.category.delete({ where: { id: categoryId } });
}
