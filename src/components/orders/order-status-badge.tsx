import type { OrderStatus } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Aguardando confirmação",
  CONFIRMED: "Confirmado",
  PREPARING: "Em preparo",
  READY: "Pronto",
  OUT_FOR_DELIVERY: "Saiu para entrega",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
};

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-muted text-muted-foreground",
  CONFIRMED: "bg-secondary text-secondary-foreground",
  PREPARING: "bg-secondary text-secondary-foreground",
  READY: "bg-primary/15 text-link",
  OUT_FOR_DELIVERY: "bg-primary/15 text-link",
  DELIVERED: "bg-primary text-primary-foreground",
  CANCELLED: "bg-destructive/10 text-destructive",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge className={cn(STATUS_STYLES[status])}>{STATUS_LABELS[status]}</Badge>
  );
}
