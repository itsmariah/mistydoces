import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  orderItem: {
    count: vi.fn(),
  },
  review: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

const { createReview } = await import("@/services/review-service");
const { AppError, ForbiddenError } = await import("@/lib/errors");

describe("createReview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejeita quem nunca comprou o produto", async () => {
    prismaMock.orderItem.count.mockResolvedValue(0);
    prismaMock.review.findUnique.mockResolvedValue(null);

    await expect(
      createReview("user-1", "product-1", { rating: 5 }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(prismaMock.review.create).not.toHaveBeenCalled();
  });

  it("rejeita uma segunda avaliação do mesmo cliente pro mesmo produto", async () => {
    prismaMock.orderItem.count.mockResolvedValue(1);
    prismaMock.review.findUnique.mockResolvedValue({ id: "existing-review" });

    await expect(
      createReview("user-1", "product-1", { rating: 4 }),
    ).rejects.toBeInstanceOf(AppError);
    expect(prismaMock.review.create).not.toHaveBeenCalled();
  });

  it("cria a avaliação quando o cliente comprou e ainda não avaliou", async () => {
    prismaMock.orderItem.count.mockResolvedValue(1);
    prismaMock.review.findUnique.mockResolvedValue(null);
    prismaMock.review.create.mockResolvedValue({ id: "review-1" });

    await createReview("user-1", "product-1", { rating: 5, comment: "Ótimo!" });

    expect(prismaMock.review.create).toHaveBeenCalledWith({
      data: { userId: "user-1", productId: "product-1", rating: 5, comment: "Ótimo!" },
    });
  });
});
