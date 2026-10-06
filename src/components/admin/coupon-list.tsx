"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import type { listCouponsAdmin } from "@/services/coupon-service";
import { deleteCoupon } from "@/actions/coupons";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { CouponForm } from "@/components/admin/coupon-form";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { COUPON_STATUS_LABELS, getCouponStatus, type CouponStatus } from "@/lib/coupon-status";
import { cn, formatCurrency } from "@/lib/utils";

type Coupon = Awaited<ReturnType<typeof listCouponsAdmin>>[number];

const STATUS_STYLES: Record<CouponStatus, string> = {
  ACTIVE: "border-transparent bg-primary/15 text-link",
  INACTIVE: "text-muted-foreground",
  EXPIRED: "text-muted-foreground",
  EXHAUSTED: "text-muted-foreground",
};

async function copyCode(code: string) {
  try {
    await navigator.clipboard.writeText(code);
    toast.success(`Código ${code} copiado.`);
  } catch {
    toast.error("Não foi possível copiar o código.");
  }
}

function describeCoupon(coupon: Coupon): string {
  const discount =
    coupon.type === "PERCENTAGE"
      ? `${Number(coupon.value)}%`
      : formatCurrency(coupon.value.toString());

  const parts = [discount];
  if (coupon.minOrderValue) {
    parts.push(`pedido mín. ${formatCurrency(coupon.minOrderValue.toString())}`);
  }
  if (coupon.maxUses) {
    parts.push(`${coupon.usedCount}/${coupon.maxUses} usos`);
  } else {
    parts.push(`${coupon.usedCount} usos`);
  }
  if (coupon.expiresAt) {
    parts.push(`válido até ${new Intl.DateTimeFormat("pt-BR").format(coupon.expiresAt)}`);
  }
  return parts.join(" — ");
}

export function CouponList({
  coupons,
  canEdit,
  canDelete,
  now,
}: {
  coupons: Coupon[];
  /** Referência para "vencido", vinda do servidor (evita divergência na hidratação). */
  now: Date;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);

  function refreshAndClose() {
    setEditingId(null);
    setAddingNew(false);
    router.refresh();
  }

  async function handleDelete(coupon: Coupon) {
    const result = await deleteCoupon(coupon.id);
    if (!result.success) {
      toast.error(result.error.message);
      return;
    }
    toast.success(`Cupom ${coupon.code} excluído.`);
    router.refresh();
  }

  if (coupons.length === 0 && !addingNew) {
    return (
      <EmptyState
        image={{ src: "/branding/06_tag_feito_com_carinho.png", width: 120, height: 120 }}
        title="Nenhum cupom ainda"
        description="Crie cupons de desconto para campanhas e clientes especiais."
        action={canEdit && <Button onClick={() => setAddingNew(true)}>Adicionar cupom</Button>}
      />
    );
  }

  return (
    <div className="space-y-3">
      {coupons.map((coupon) =>
        editingId === coupon.id ? (
          <CouponForm
            key={coupon.id}
            couponId={coupon.id}
            defaultValues={{
              code: coupon.code,
              type: coupon.type,
              value: Number(coupon.value),
              minOrderValue: coupon.minOrderValue ? Number(coupon.minOrderValue) : undefined,
              maxUses: coupon.maxUses ?? undefined,
              isActive: coupon.isActive,
              expiresAt: coupon.expiresAt
                ? coupon.expiresAt.toISOString().slice(0, 10)
                : undefined,
            }}
            onSuccess={refreshAndClose}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <div
            key={coupon.id}
            className="flex items-center justify-between rounded-lg surface p-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium">{coupon.code}</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Copiar código ${coupon.code}`}
                  onClick={() => copyCode(coupon.code)}
                >
                  <Copy />
                </Button>
                <CouponStatusBadge status={getCouponStatus(coupon, now)} />
              </div>
              <p className="text-sm text-muted-foreground">{describeCoupon(coupon)}</p>
            </div>

            {(canEdit || canDelete) && (
              <div className="flex gap-2">
                {canEdit && (
                  <Button variant="outline" size="sm" onClick={() => setEditingId(coupon.id)}>
                    Editar
                  </Button>
                )}
                {canDelete && (
                  <ConfirmDialog
                    trigger={
                      <Button variant="destructive" size="sm">
                        Excluir
                      </Button>
                    }
                    title={`Excluir o cupom ${coupon.code}?`}
                    description="Pedidos que já usaram o cupom não são afetados. Essa ação não pode ser desfeita."
                    confirmLabel="Excluir"
                    destructive
                    onConfirm={() => handleDelete(coupon)}
                  />
                )}
              </div>
            )}
          </div>
        ),
      )}

      {canEdit &&
        (addingNew ? (
          <CouponForm onSuccess={refreshAndClose} onCancel={() => setAddingNew(false)} />
        ) : (
          <Button variant="outline" onClick={() => setAddingNew(true)}>
            Adicionar cupom
          </Button>
        ))}
    </div>
  );
}

function CouponStatusBadge({ status }: { status: CouponStatus }) {
  return (
    <Badge variant="outline" className={cn(STATUS_STYLES[status])}>
      {COUPON_STATUS_LABELS[status]}
    </Badge>
  );
}
