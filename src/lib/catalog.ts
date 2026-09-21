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
      ...(params?.categorySlug
        ? { category: { slug: params.categorySlug } }
        : {}),
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
    where: { slug, isActive: true },
    include: {
      category: true,
      variants: { orderBy: { sortOrder: "asc" } },
    },
  });
}
