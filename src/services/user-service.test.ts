import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  $queryRaw: vi.fn(),
  $transaction: vi.fn((callback: (tx: unknown) => unknown) => callback(prismaMock)),
  user: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

const { addTeamMember, setUserRole } = await import("@/services/user-service");
const { AppError, NotFoundError } = await import("@/lib/errors");

describe("setUserRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("não deixa ninguém alterar o próprio nível", async () => {
    await expect(setUserRole("owner-1", "owner-1", "CUSTOMER")).rejects.toMatchObject({
      code: "CANNOT_CHANGE_OWN_ROLE",
    });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("não rebaixa o último proprietário", async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ id: "owner-2" }]);
    prismaMock.user.findUnique.mockResolvedValue({ id: "owner-2", role: "OWNER" });

    await expect(setUserRole("owner-1", "owner-2", "MANAGER")).rejects.toMatchObject({
      code: "LAST_OWNER",
    });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("rebaixa um proprietário quando há outro", async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ id: "owner-1" }, { id: "owner-2" }]);
    prismaMock.user.findUnique.mockResolvedValue({ id: "owner-2", role: "OWNER" });

    await setUserRole("owner-1", "owner-2", "CUSTOMER");
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "owner-2" },
      data: { role: "CUSTOMER" },
    });
  });

  it("promove quem não é proprietário sem depender da contagem", async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ id: "owner-1" }]);
    prismaMock.user.findUnique.mockResolvedValue({ id: "staff-1", role: "STAFF" });

    await setUserRole("owner-1", "staff-1", "MANAGER");
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "staff-1" },
      data: { role: "MANAGER" },
    });
  });
});

describe("addTeamMember", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exige uma conta já cadastrada", async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);

    await expect(addTeamMember("owner-1", "nova@exemplo.com", "STAFF")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("recusa quem já está na equipe", async () => {
    prismaMock.user.findFirst.mockResolvedValue({ id: "m-1", name: "Ana", role: "MANAGER" });

    const promise = addTeamMember("owner-1", "ana@exemplo.com", "STAFF");
    await expect(promise).rejects.toBeInstanceOf(AppError);
    await expect(promise).rejects.toMatchObject({ code: "ALREADY_IN_TEAM" });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("promove um cliente ao nível escolhido", async () => {
    prismaMock.user.findFirst.mockResolvedValue({ id: "c-1", name: "Bia", role: "CUSTOMER" });
    prismaMock.$queryRaw.mockResolvedValue([{ id: "owner-1" }]);
    prismaMock.user.findUnique.mockResolvedValue({ id: "c-1", role: "CUSTOMER" });

    await addTeamMember("owner-1", "BIA@exemplo.com", "STAFF");
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "c-1" },
      data: { role: "STAFF" },
    });
  });
});
