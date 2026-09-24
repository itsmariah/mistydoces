import { prisma } from "@/lib/prisma";

export function getCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export function getProducts(params?: { categorySlug?: string }) {
  return prisma.product.findMany({
    where: {
      isActive: true,
      category: {
        isActive: true,
        ...(params?.categorySlug ? { slug: params.categorySlug } : {}),
      },
    },
    include: {
      category: true,
      variants: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { name: "asc" },
  });
}

const PRODUCT_LISTING_INCLUDE = {
  category: true,
  variants: { orderBy: { sortOrder: "asc" } },
} as const;

/** Produtos visíveis na ordem dos ids recebidos (ex.: ranking de mais vendidos). */
export async function getProductsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true, category: { isActive: true } },
    include: PRODUCT_LISTING_INCLUDE,
  });
  return products.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
}

export function getLatestProducts(limit: number) {
  return prisma.product.findMany({
    where: { isActive: true, category: { isActive: true } },
    include: PRODUCT_LISTING_INCLUDE,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, isActive: true, category: { isActive: true } },
    include: {
      category: true,
      variants: { orderBy: { sortOrder: "asc" } },
    },
  });
}
