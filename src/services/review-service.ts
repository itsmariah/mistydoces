import { prisma } from "@/lib/prisma";
import { AppError, ForbiddenError, NotFoundError } from "@/lib/errors";
import type { ReviewInput } from "@/validations/review";

export function getProductReviews(productId: string) {
  return prisma.review.findMany({
    where: { productId, isVisible: true },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  });
}

export async function getProductRatingSummary(productId: string) {
  const result = await prisma.review.aggregate({
    where: { productId, isVisible: true },
    _avg: { rating: true },
    _count: true,
  });
  return { average: result._avg.rating ?? 0, count: result._count };
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

export function adminListReviews() {
  return prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true } },
      product: { select: { name: true, slug: true } },
    },
  });
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
