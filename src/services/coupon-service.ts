import type { Coupon } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError, NotFoundError } from "@/lib/errors";
import { fromCents, toCents } from "@/lib/money";
import { formatCurrency } from "@/lib/utils";
import type { CouponInput } from "@/validations/coupon";

export function listCouponsAdmin() {
  return prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
}

function toData(input: CouponInput) {
  return {
    code: input.code,
    type: input.type,
    value: input.value,
    minOrderValue: input.minOrderValue ?? null,
    maxUses: input.maxUses ?? null,
    isActive: input.isActive,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
  };
}

export async function createCoupon(input: CouponInput) {
  const existing = await prisma.coupon.findUnique({ where: { code: input.code } });
  if (existing) {
    throw new AppError("COUPON_CODE_TAKEN", "Já existe um cupom com esse código.", 409);
  }
  return prisma.coupon.create({ data: toData(input) });
}

export async function updateCoupon(couponId: string, input: CouponInput) {
  const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
  if (!coupon) throw new NotFoundError("Cupom não encontrado.");

  if (coupon.code !== input.code) {
    const codeTaken = await prisma.coupon.findUnique({ where: { code: input.code } });
    if (codeTaken) {
      throw new AppError("COUPON_CODE_TAKEN", "Já existe um cupom com esse código.", 409);
    }
  }

  return prisma.coupon.update({ where: { id: couponId }, data: toData(input) });
}

export async function deleteCoupon(couponId: string) {
  const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
  if (!coupon) throw new NotFoundError("Cupom não encontrado.");
  await prisma.coupon.delete({ where: { id: couponId } });
}

export async function findCouponByCode(code: string) {
  const coupon = await prisma.coupon.findUnique({
    where: { code: code.trim().toUpperCase() },
  });
  if (!coupon) throw new NotFoundError("Cupom não encontrado.");
  return coupon;
}

/**
 * Valida as regras do cupom (ativo, validade, limite de usos, pedido mínimo)
 * e calcula o desconto em centavos — não debita uso; isso só acontece na
 * criação do pedido (ver `createOrder`), dentro de uma transação atômica.
 */
export function evaluateCoupon(coupon: Coupon, subtotalCents: number): number {
  if (!coupon.isActive) {
    throw new AppError("COUPON_INACTIVE", "Este cupom não está mais ativo.", 409);
  }
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    throw new AppError("COUPON_EXPIRED", "Este cupom expirou.", 409);
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    throw new AppError("COUPON_EXHAUSTED", "Este cupom atingiu o limite de usos.", 409);
  }

  const minOrderCents = coupon.minOrderValue ? toCents(coupon.minOrderValue) : 0;
  if (subtotalCents < minOrderCents) {
    throw new AppError(
      "COUPON_MIN_ORDER_NOT_MET",
      `Este cupom exige um pedido mínimo de ${formatCurrency(fromCents(minOrderCents))}.`,
      409,
    );
  }

  if (coupon.type === "PERCENTAGE") {
    return Math.round(subtotalCents * (Number(coupon.value) / 100));
  }
  // FIXED — nunca deixa o desconto exceder o subtotal
  return Math.min(toCents(coupon.value), subtotalCents);
}

/** Prévia do desconto pro checkout — mesma validação do `createOrder`, sem debitar uso. */
export async function previewCoupon(code: string, subtotal: number) {
  const coupon = await findCouponByCode(code);
  const discountCents = evaluateCoupon(coupon, toCents(subtotal));
  return { discount: fromCents(discountCents) };
}

/**
 * Incrementa o uso atomicamente — falha (retorna false) se outro pedido já
 * esgotou o cupom nesse meio-tempo. Usa SQL bruto porque o Prisma Client não
 * compara duas colunas da mesma linha (`usedCount < maxUses`) num `where`.
 */
export async function consumeCouponUse(
  tx: Pick<typeof prisma, "$executeRaw">,
  couponId: string,
): Promise<boolean> {
  const affected = await tx.$executeRaw`
    UPDATE "Coupon"
    SET "usedCount" = "usedCount" + 1
    WHERE "id" = ${couponId} AND ("maxUses" IS NULL OR "usedCount" < "maxUses")
  `;
  return affected > 0;
}
