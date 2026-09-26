import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  orderItem: {
    count: vi.fn(),
  },
  review: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    groupBy: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

const { adminListReviews, createReview, getFeaturedReviews } = await import("@/services/review-service");
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

describe("getFeaturedReviews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("expõe só o primeiro nome de quem avaliou", async () => {
    prismaMock.review.findMany.mockResolvedValue([
      {
        id: "review-1",
        rating: 5,
        comment: "Maravilhoso!",
        user: { name: "  Maria Clara Souza " },
        product: { name: "Bolo", slug: "bolo" },
      },
    ]);

    const [review] = await getFeaturedReviews(3);

    expect(review.authorFirstName).toBe("Maria");
    expect(review).not.toHaveProperty("user");
  });

  it("busca só avaliações visíveis, 4+ e com comentário", async () => {
    prismaMock.review.findMany.mockResolvedValue([]);

    await getFeaturedReviews(3);

    const { where, take } = prismaMock.review.findMany.mock.calls[0][0];
    expect(where).toMatchObject({ isVisible: true, rating: { gte: 4 }, comment: { not: null } });
    expect(take).toBe(3);
  });
});

describe("adminListReviews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.review.findMany.mockResolvedValue([]);
  });

  it("aplica os dois filtros na lista e contagens cruzadas nos grupos", async () => {
    prismaMock.review.groupBy
      .mockResolvedValueOnce([{ rating: 5, _count: { _all: 3 } }])
      .mockResolvedValueOnce([
        { isVisible: true, _count: { _all: 2 } },
        { isVisible: false, _count: { _all: 1 } },
      ]);

    const result = await adminListReviews({ rating: 5, isVisible: false });

    expect(prismaMock.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { rating: 5, isVisible: false } }),
    );
    // Contagem por nota respeita só a visibilidade; por visibilidade, só a nota.
    expect(prismaMock.review.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ by: ["rating"], where: { isVisible: false } }),
    );
    expect(prismaMock.review.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ by: ["isVisible"], where: { rating: 5 } }),
    );
    expect(result).toMatchObject({ ratingCounts: { 5: 3 }, visibleCount: 2, hiddenCount: 1 });
  });

  it("sem filtros, não restringe nada", async () => {
    prismaMock.review.groupBy.mockResolvedValue([]);

    const result = await adminListReviews();

    expect(prismaMock.review.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    expect(result).toMatchObject({ visibleCount: 0, hiddenCount: 0 });
  });
});
