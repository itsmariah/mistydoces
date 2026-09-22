import { prisma } from "@/lib/prisma";
import { AppError, NotFoundError } from "@/lib/errors";
import { slugify } from "@/lib/utils";
import type { ProductInput } from "@/validations/product";

export function listProductsAdmin() {
  return prisma.product.findMany({
    orderBy: { name: "asc" },
    include: { category: true, variants: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function getProductByIdAdmin(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { variants: { orderBy: { sortOrder: "asc" } } },
  });
  if (!product) throw new NotFoundError("Produto não encontrado.");
  return product;
}

async function uniqueSlug(name: string, ignoreId?: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let suffix = 1;

  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing || existing.id === ignoreId) return slug;
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}

export async function createProduct(input: ProductInput) {
  const slug = await uniqueSlug(input.name);
  return prisma.product.create({
    data: {
      name: input.name,
      slug,
      description: input.description,
      imageUrl: input.imageUrl || null,
      categoryId: input.categoryId,
      isAvailable: input.isAvailable,
      isActive: input.isActive,
      variants: {
        create: input.variants.map((variant, index) => ({
          label: variant.label,
          price: variant.price,
          sortOrder: index,
        })),
      },
    },
  });
}

export async function updateProduct(productId: string, input: ProductInput) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { variants: true },
  });
  if (!product) throw new NotFoundError("Produto não encontrado.");

  const slug =
    product.name === input.name ? product.slug : await uniqueSlug(input.name, productId);

  const existingVariantIds = new Set(product.variants.map((v) => v.id));
  const submittedIds = new Set(
    input.variants.map((v) => v.id).filter((id): id is string => Boolean(id)),
  );
  const toDeleteIds = [...existingVariantIds].filter((id) => !submittedIds.has(id));

  if (toDeleteIds.length > 0) {
    const orderedCount = await prisma.orderItem.count({
      where: { variantId: { in: toDeleteIds } },
    });
    if (orderedCount > 0) {
      throw new AppError(
        "VARIANT_HAS_ORDERS",
        "Uma ou mais variantes removidas já têm pedidos associados e não podem ser excluídas. Edite o nome/preço em vez de remover.",
        409,
      );
    }
  }

  await prisma.$transaction([
    ...(toDeleteIds.length > 0
      ? [prisma.productVariant.deleteMany({ where: { id: { in: toDeleteIds } } })]
      : []),
    ...input.variants.map((variant, index) =>
      variant.id
        ? prisma.productVariant.update({
            where: { id: variant.id },
            data: { label: variant.label, price: variant.price, sortOrder: index },
          })
        : prisma.productVariant.create({
            data: { productId, label: variant.label, price: variant.price, sortOrder: index },
          }),
    ),
    prisma.product.update({
      where: { id: productId },
      data: {
        name: input.name,
        slug,
        description: input.description,
        imageUrl: input.imageUrl || null,
        categoryId: input.categoryId,
        isAvailable: input.isAvailable,
        isActive: input.isActive,
      },
    }),
  ]);
}
