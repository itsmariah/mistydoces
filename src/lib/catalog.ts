import { cache } from "react";
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

/** Categorias ativas com a contagem só de produtos visíveis — para os atalhos da home. */
export function getCategoriesWithProductCount() {
  return prisma.category.findMany({
    where: { isActive: true, products: { some: { isActive: true } } },
    orderBy: { name: "asc" },
    include: { _count: { select: { products: { where: { isActive: true } } } } },
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

/** Produtos visíveis na ordem dos slugs recebidos (ex.: "Vistos recentemente"). */
export async function getProductsBySlugs(slugs: string[]) {
  if (slugs.length === 0) return [];
  const products = await prisma.product.findMany({
    where: { slug: { in: slugs }, isActive: true, category: { isActive: true } },
    include: PRODUCT_LISTING_INCLUDE,
  });
  return products.sort((a, b) => slugs.indexOf(a.slug) - slugs.indexOf(b.slug));
}

export function getLatestProducts(limit: number) {
  return prisma.product.findMany({
    where: { isActive: true, category: { isActive: true } },
    include: PRODUCT_LISTING_INCLUDE,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * "Você também vai gostar": primeiro da mesma categoria, completando com o resto do
 * cardápio se faltar. Disponíveis antes de esgotados, mais novos primeiro.
 */
export async function getRelatedProducts(
  product: { id: string; categoryId: string },
  limit: number,
) {
  const visible = { isActive: true, category: { isActive: true } };
  const orderBy = [{ isAvailable: "desc" }, { createdAt: "desc" }] as const;

  const sameCategory = await prisma.product.findMany({
    where: { ...visible, categoryId: product.categoryId, id: { not: product.id } },
    include: PRODUCT_LISTING_INCLUDE,
    orderBy: [...orderBy],
    take: limit,
  });
  if (sameCategory.length >= limit) return sameCategory;

  const others = await prisma.product.findMany({
    where: { ...visible, id: { notIn: [product.id, ...sameCategory.map((p) => p.id)] } },
    include: PRODUCT_LISTING_INCLUDE,
    orderBy: [...orderBy],
    take: limit - sameCategory.length,
  });
  return [...sameCategory, ...others];
}

// `cache`: a página do produto e o `generateMetadata` dela buscam o mesmo produto
// na mesma requisição — assim a consulta roda uma vez só.
export const getProductBySlug = cache((slug: string) => {
  return prisma.product.findFirst({
    where: { slug, isActive: true, category: { isActive: true } },
    include: {
      category: true,
      variants: { orderBy: { sortOrder: "asc" } },
    },
  });
});
