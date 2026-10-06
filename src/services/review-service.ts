import { prisma } from "@/lib/prisma";
import { AppError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { summarizeRatings, type RatingBreakdown, type RatingSummary } from "@/lib/rating";
import type { ReviewInput } from "@/validations/review";

export function getProductReviews(productId: string) {
  return prisma.review.findMany({
    where: { productId, isVisible: true },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, avatarUrl: true } } },
  });
}

/**
 * Avaliações para a vitrine de depoimentos da home: só as bem avaliadas (4+) e com
 * comentário escrito, de produtos ainda à venda. Expõe apenas o primeiro nome de
 * quem avaliou — a home é pública.
 */
export async function getFeaturedReviews(limit: number) {
  const reviews = await prisma.review.findMany({
    where: {
      isVisible: true,
      rating: { gte: 4 },
      comment: { not: null },
      NOT: { comment: "" },
      product: { isActive: true },
    },
    orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      rating: true,
      comment: true,
      user: { select: { name: true } },
      product: { select: { name: true, slug: true } },
    },
  });

  return reviews.map(({ user, ...review }) => ({
    ...review,
    comment: review.comment ?? "",
    authorFirstName: user.name.trim().split(/\s+/)[0],
  }));
}

/** Média, total e distribuição por nota das avaliações visíveis de um produto. */
export async function getProductRatingSummary(productId: string): Promise<RatingBreakdown> {
  const rows = await prisma.review.groupBy({
    by: ["rating"],
    where: { productId, isVisible: true },
    _count: { _all: true },
  });
  return summarizeRatings(rows.map((row) => ({ rating: row.rating, count: row._count._all })));
}

/**
 * Média e total de avaliações visíveis por produto, para os cards. Sem `productIds`,
 * traz todos os produtos avaliados (o cardápio mostra o catálogo inteiro).
 */
export async function getRatingSummaries(
  productIds?: string[],
): Promise<Map<string, RatingSummary>> {
  if (productIds?.length === 0) return new Map();
  const rows = await prisma.review.groupBy({
    by: ["productId"],
    where: { isVisible: true, ...(productIds ? { productId: { in: productIds } } : {}) },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return new Map(
    rows.map((row) => [row.productId, { average: row._avg.rating ?? 0, count: row._count._all }]),
  );
}

async function hasPurchasedProduct(userId: string, productId: string): Promise<boolean> {
  const count = await prisma.orderItem.count({
    where: {
      order: { userId, status: "DELIVERED" },
      variant: { productId },
    },
  });
  return count > 0;
}

export async function getReviewEligibility(userId: string, productId: string) {
  const [purchased, existingReview] = await Promise.all([
    hasPurchasedProduct(userId, productId),
    prisma.review.findUnique({ where: { userId_productId: { userId, productId } } }),
  ]);

  return {
    canReview: purchased && !existingReview,
    hasPurchased: purchased,
    alreadyReviewed: Boolean(existingReview),
  };
}

/**
 * Produtos que o cliente já recebeu (pedido DELIVERED) e ainda não avaliou — para o
 * lembrete "Avalie seus doces" da conta. Mesma regra de elegibilidade do `createReview`.
 */
export async function getPendingReviewProducts(userId: string, limit: number) {
  const where = {
    isActive: true,
    variants: { some: { orderItems: { some: { order: { userId, status: "DELIVERED" as const } } } } },
    reviews: { none: { userId } },
  };
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: { id: true, name: true, slug: true, imageUrl: true },
      orderBy: { name: "asc" },
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);
  return { products, total };
}

export async function createReview(userId: string, productId: string, input: ReviewInput) {
  // Revalida a elegibilidade no backend — nunca confia no botão estar
  // visível/escondido no client.
  const eligibility = await getReviewEligibility(userId, productId);
  if (!eligibility.hasPurchased) {
    throw new ForbiddenError("Você só pode avaliar produtos que já comprou e recebeu.");
  }
  if (eligibility.alreadyReviewed) {
    throw new AppError("REVIEW_ALREADY_EXISTS", "Você já avaliou este produto.", 409);
  }

  return prisma.review.create({
    data: { userId, productId, rating: input.rating, comment: input.comment || null },
  });
}

export const ADMIN_REVIEWS_PAGE_SIZE = 20;

export async function adminListReviews({
  rating,
  isVisible,
  page = 1,
}: {
  rating?: number;
  isVisible?: boolean;
  page?: number;
} = {}) {
  const ratingWhere = rating === undefined ? {} : { rating };
  const visibilityWhere = isVisible === undefined ? {} : { isVisible };

  const [reviews, byRating, byVisibility] = await Promise.all([
    prisma.review.findMany({
      where: { ...ratingWhere, ...visibilityWhere },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_REVIEWS_PAGE_SIZE,
      take: ADMIN_REVIEWS_PAGE_SIZE,
      include: {
        user: { select: { name: true } },
        product: { select: { name: true, slug: true } },
      },
    }),
    // Contagens cruzadas: cada grupo de filtros respeita o outro, mas não a si mesmo.
    prisma.review.groupBy({ by: ["rating"], where: visibilityWhere, _count: { _all: true } }),
    prisma.review.groupBy({ by: ["isVisible"], where: ratingWhere, _count: { _all: true } }),
  ]);

  const ratingCounts = Object.fromEntries(
    byRating.map((row) => [row.rating, row._count._all]),
  ) as Partial<Record<number, number>>;
  // O total da lista sai das contagens por nota (que já respeitam a visibilidade):
  // sem nota escolhida, é a soma de todas; com nota, é a contagem dela.
  const total =
    rating === undefined
      ? byRating.reduce((sum, row) => sum + row._count._all, 0)
      : (ratingCounts[rating] ?? 0);

  return {
    reviews,
    total,
    totalPages: Math.max(1, Math.ceil(total / ADMIN_REVIEWS_PAGE_SIZE)),
    ratingCounts,
    visibleCount: byVisibility.find((row) => row.isVisible)?._count._all ?? 0,
    hiddenCount: byVisibility.find((row) => !row.isVisible)?._count._all ?? 0,
  };
}

export async function adminSetReviewVisibility(reviewId: string, isVisible: boolean) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new NotFoundError("Avaliação não encontrada.");
  return prisma.review.update({ where: { id: reviewId }, data: { isVisible } });
}

export async function adminDeleteReview(reviewId: string) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new NotFoundError("Avaliação não encontrada.");
  await prisma.review.delete({ where: { id: reviewId } });
}
