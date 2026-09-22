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

export function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, isActive: true, category: { isActive: true } },
    include: {
      category: true,
      variants: { orderBy: { sortOrder: "asc" } },
    },
  });
}
