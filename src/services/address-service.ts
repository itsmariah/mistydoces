import { prisma } from "@/lib/prisma";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import type { AddressInput } from "@/validations/order";

export function getUserAddresses(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

export async function createAddress(userId: string, input: AddressInput) {
  const hasAddress = await prisma.address.findFirst({ where: { userId } });
  return prisma.address.create({
    data: { ...input, userId, isDefault: !hasAddress },
  });
}

async function requireOwnedAddress(userId: string, addressId: string) {
  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address) throw new NotFoundError("Endereço não encontrado.");
  if (address.userId !== userId) throw new ForbiddenError();
  return address;
}

export async function updateAddress(
  userId: string,
  addressId: string,
  input: AddressInput,
) {
  await requireOwnedAddress(userId, addressId);
  return prisma.address.update({ where: { id: addressId }, data: input });
}

export async function deleteAddress(userId: string, addressId: string) {
  const address = await requireOwnedAddress(userId, addressId);
  await prisma.address.delete({ where: { id: addressId } });

  // Se o endereço removido era o padrão, promove o mais antigo restante para
  // que o usuário sempre tenha um padrão claro no próximo checkout.
  if (address.isDefault) {
    const next = await prisma.address.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
    if (next) {
      await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  }
}

export async function setDefaultAddress(userId: string, addressId: string) {
  await requireOwnedAddress(userId, addressId);

  await prisma.$transaction([
    prisma.address.updateMany({ where: { userId }, data: { isDefault: false } }),
    prisma.address.update({ where: { id: addressId }, data: { isDefault: true } }),
  ]);
}
