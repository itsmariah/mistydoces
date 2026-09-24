import {
  Bike,
  ChefHat,
  CircleCheck,
  CircleX,
  ClipboardList,
  Heart,
  PackageCheck,
  Store,
  type LucideIcon,
} from "lucide-react";
import type { DeliveryType, OrderStatus } from "@/generated/prisma/client";
import { getTimelineSteps } from "@/lib/order-status";
import { cn } from "@/lib/utils";

type StepCopy = { label: string; description: string; icon: LucideIcon };

const DELIVERY_COPY: Partial<Record<OrderStatus, StepCopy>> = {
  PENDING: { label: "Recebido", description: "Aguardando a confirmação da loja.", icon: ClipboardList },
  CONFIRMED: { label: "Confirmado", description: "A loja aceitou seu pedido.", icon: CircleCheck },
  PREPARING: { label: "Em preparo", description: "A chef Misty está na cozinha!", icon: ChefHat },
  READY: { label: "Pronto", description: "Seu pedido está pronto.", icon: PackageCheck },
  OUT_FOR_DELIVERY: { label: "Saiu para entrega", description: "Está a caminho de você.", icon: Bike },
  DELIVERED: { label: "Entregue", description: "Bom apetite!", icon: Heart },
};

const PICKUP_COPY: Partial<Record<OrderStatus, StepCopy>> = {
  ...DELIVERY_COPY,
  READY: {
    label: "Pronto para retirada",
    description: "Pode vir buscar quando quiser.",
    icon: Store,
  },
  DELIVERED: { label: "Retirado", description: "Bom apetite!", icon: Heart },
};

type OrderTimelineProps = {
  status: OrderStatus;
  deliveryType: DeliveryType;
};

export function OrderTimeline({ status, deliveryType }: OrderTimelineProps) {
  if (status === "CANCELLED") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
        <CircleX className="h-5 w-5 shrink-0 text-destructive" />
        <p>Este pedido foi cancelado.</p>
      </div>
    );
  }

  const copy = deliveryType === "PICKUP" ? PICKUP_COPY : DELIVERY_COPY;
  const steps = getTimelineSteps(status, deliveryType);

  return (
    <ol aria-label="Andamento do pedido" className="flex flex-col sm:flex-row">
      {steps.map((step, index) => {
        const { label, description, icon: Icon } = copy[step.status]!;
        const isLast = index === steps.length - 1;
        const nextIsReached = !isLast && steps[index + 1].state !== "upcoming";

        return (
          <li
            key={step.status}
            aria-current={step.state === "current" ? "step" : undefined}
            className="relative flex gap-3 pb-6 last:pb-0 sm:flex-1 sm:flex-col sm:items-center sm:gap-2 sm:pb-0 sm:text-center"
          >
            {!isLast && (
              // Conector até a próxima etapa: vertical no celular, horizontal a partir de `sm`.
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-9 bottom-1 left-4 w-0.5 -translate-x-1/2 rounded-full sm:top-4 sm:right-[calc(-50%+1.5rem)] sm:bottom-auto sm:left-[calc(50%+1.5rem)] sm:h-0.5 sm:w-auto sm:translate-x-0",
                  nextIsReached ? "bg-primary" : "bg-border",
                )}
              />
            )}

            <span
              className={cn(
                "relative flex size-8 shrink-0 items-center justify-center rounded-full",
                step.state === "done" && "bg-primary text-primary-foreground",
                step.state === "current" &&
                  "bg-secondary text-secondary-foreground ring-4 ring-secondary/60",
                step.state === "upcoming" && "bg-muted text-muted-foreground",
              )}
            >
              {step.state === "current" && (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 animate-ping rounded-full bg-secondary opacity-60 [animation-duration:2s]"
                />
              )}
              <Icon className="relative h-4 w-4" />
            </span>

            <div className="space-y-0.5 pt-1 sm:pt-0">
              <p
                className={cn(
                  "text-sm font-medium",
                  step.state === "upcoming" && "text-muted-foreground",
                )}
              >
                {label}
              </p>
              {step.state === "current" && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
