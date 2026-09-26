export type CouponStatus = "ACTIVE" | "INACTIVE" | "EXPIRED" | "EXHAUSTED";

type CouponLike = {
  isActive: boolean;
  expiresAt: Date | null;
  maxUses: number | null;
  usedCount: number;
};

/**
 * Situação do cupom, na mesma ordem de prioridade em que o checkout recusa
 * (`evaluateCoupon`): desativado manualmente, depois vencido, depois sem usos.
 */
export function getCouponStatus(coupon: CouponLike, now: Date): CouponStatus {
  if (!coupon.isActive) return "INACTIVE";
  if (coupon.expiresAt && coupon.expiresAt.getTime() < now.getTime()) return "EXPIRED";
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return "EXHAUSTED";
  return "ACTIVE";
}

export const COUPON_STATUS_LABELS: Record<CouponStatus, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  EXPIRED: "Vencido",
  EXHAUSTED: "Usos esgotados",
};
