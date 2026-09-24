import type { OrderStatus, PaymentStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  AppError,
  ForbiddenError,
  InvalidStatusTransitionError,
  NotFoundError,
  ProductUnavailableError,
} from "@/lib/errors";
import { canCustomerCancel, canTransition } from "@/lib/order-status";
import { toCents, fromCents } from "@/lib/money";
import { getDeliveryFee } from "@/services/store-settings-service";
import * as couponService from "@/services/coupon-service";
import * as notificationService from "@/services/notification-service";
import type { CheckoutInput } from "@/validations/order";

export async function createOrder(userId: string, input: CheckoutInput) {
  // Endereço: usa um já salvo (validando posse) ou cadastra um novo antes do pedido.
  let addressId: string | null = null;
  if (input.deliveryType === "DELIVERY") {
    if (input.addressId) {
      const address = await prisma.address.findUnique({
        where: { id: input.addressId },
      });
      if (!address || address.userId !== userId) {
        throw new NotFoundError("Endereço não encontrado.");
      }
      addressId = address.id;
    } else if (input.newAddress) {
      const hasAddress = await prisma.address.findFirst({ where: { userId } });
      const created = await prisma.address.create({
        data: {
          ...input.newAddress,
          userId,
          isDefault: !hasAddress,
        },
      });
      addressId = created.id;
    }
  }

  const address = addressId
    ? await prisma.address.findUniqueOrThrow({ where: { id: addressId } })
    : null;

  // Revalida cada item no backend: preço e disponibilidade nunca vêm do client.
  const variantIds = input.items.map((item) => item.variantId);
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: { product: { include: { category: true } } },
  });

  let subtotalCents = 0;
  const orderItemsData = input.items.map((item) => {
    const variant = variants.find((v) => v.id === item.variantId);
    if (!variant) {
      throw new NotFoundError("Um dos itens do carrinho não existe mais.");
    }
    if (
      !variant.product.isActive ||
      !variant.product.isAvailable ||
      !variant.product.category.isActive
    ) {
      throw new ProductUnavailableError(variant.product.name);
    }

    const unitPriceCents = toCents(variant.price);
    const lineCents = unitPriceCents * item.quantity;
    subtotalCents += lineCents;

    return {
      variantId: variant.id,
      productNameSnapshot: variant.product.name,
      variantLabelSnapshot: variant.label,
      unitPriceSnapshot: fromCents(unitPriceCents),
      quantity: item.quantity,
      subtotal: fromCents(lineCents),
    };
  });

  const deliveryFeeCents =
    input.deliveryType === "DELIVERY" ? toCents(await getDeliveryFee()) : 0;

  // Revalida o cupom no backend, igual a preço/disponibilidade — nunca confia
  // no desconto calculado no client.
  const coupon = input.couponCode
    ? await couponService.findCouponByCode(input.couponCode)
    : null;
  const discountCents = coupon ? couponService.evaluateCoupon(coupon, subtotalCents) : 0;

  const totalCents = subtotalCents - discountCents + deliveryFeeCents;

  const order = await prisma.$transaction(async (tx) => {
    if (coupon) {
      // Debita o uso só agora (não na validação/prévia), de forma atômica —
      // evita estourar `maxUses` se dois pedidos usarem o último uso disponível
      // ao mesmo tempo.
      const consumed = await couponService.consumeCouponUse(tx, coupon.id);
      if (!consumed) {
        throw new AppError(
          "COUPON_EXHAUSTED",
          "Este cupom atingiu o limite de usos enquanto você finalizava o pedido.",
          409,
        );
      }
    }

    return tx.order.create({
      data: {
        userId,
        status: "PENDING",
        deliveryType: input.deliveryType,
        addressId: address?.id,
        deliveryLabel: address?.label,
        deliveryZipCode: address?.zipCode,
        deliveryStreet: address?.street,
        deliveryNumber: address?.number,
        deliveryComplement: address?.complement,
        deliveryNeighborhood: address?.neighborhood,
        deliveryCity: address?.city,
        deliveryState: address?.state,
        deliveryReference: address?.reference,
        couponId: coupon?.id,
        couponCodeSnapshot: coupon?.code,
        discountAmount: fromCents(discountCents),
        notes: input.notes || null,
        subtotal: fromCents(subtotalCents),
        deliveryFee: fromCents(deliveryFeeCents),
        total: fromCents(totalCents),
        items: { create: orderItemsData },
        payment: { create: { method: input.paymentMethod } },
      },
      include: { items: true, payment: true },
    });
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  if (user) {
    await notificationService.sendOrderConfirmationEmail(order, user);
  }

  return order;
}

export function getUserOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { items: true, payment: true },
  });
}

export async function getUserOrderById(userId: string, orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, payment: true },
  });
  if (!order) throw new NotFoundError("Pedido não encontrado.");
  if (order.userId !== userId) throw new ForbiddenError();
  return order;
}

export async function cancelOrder(userId: string, orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError("Pedido não encontrado.");
  if (order.userId !== userId) throw new ForbiddenError();
  if (!canCustomerCancel(order.status)) {
    throw new InvalidStatusTransitionError(order.status, "CANCELLED");
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED" },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  if (user) {
    await notificationService.sendOrderStatusUpdateEmail(updated, user, "CANCELLED");
  }

  return updated;
}

export function adminListOrders(status?: OrderStatus) {
  return prisma.order.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    include: { items: true, payment: true, user: { select: { name: true, email: true } } },
  });
}

export async function adminGetOrderById(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      payment: true,
      user: { select: { name: true, email: true, phone: true } },
    },
  });
  if (!order) throw new NotFoundError("Pedido não encontrado.");
  return order;
}

export async function adminUpdateOrderStatus(orderId: string, status: OrderStatus) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError("Pedido não encontrado.");
  if (!canTransition(order.status, status, order.deliveryType)) {
    throw new InvalidStatusTransitionError(order.status, status);
  }

  const updated = await prisma.order.update({ where: { id: orderId }, data: { status } });

  const user = await prisma.user.findUnique({
    where: { id: order.userId },
    select: { name: true, email: true },
  });
  if (user) {
    await notificationService.sendOrderStatusUpdateEmail(updated, user, status);
  }

  return updated;
}

export async function adminMarkPaymentPaid(orderId: string) {
  const payment = await prisma.payment.findUnique({ where: { orderId } });
  if (!payment) throw new NotFoundError("Pagamento não encontrado.");
  if (payment.provider) {
    throw new AppError(
      "PAYMENT_MANAGED_BY_GATEWAY",
      "Este pagamento é processado pelo Mercado Pago — só o gateway pode confirmá-lo.",
      409,
    );
  }

  return prisma.payment.update({
    where: { orderId },
    data: { status: "PAID", paidAt: new Date() },
  });
}

/**
 * Aplica o resultado de um pagamento de gateway (chamado pelo webhook, nunca pelo
 * client). Confirma o pedido automaticamente quando o pagamento é aprovado — a
 * única forma de um pedido online sair de PENDING sem ação manual da admin.
 * Idempotente: notificações repetidas do mesmo status não disparam efeito duplo.
 */
export async function applyGatewayPaymentUpdate(
  orderId: string,
  data: { status: PaymentStatus; externalId: string; externalStatus: string },
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true },
  });
  if (!order || !order.payment) throw new NotFoundError("Pedido ou pagamento não encontrado.");

  if (order.payment.status === data.status && order.payment.externalStatus === data.externalStatus) {
    return order;
  }

  const shouldConfirmOrder = data.status === "PAID" && order.status === "PENDING";

  const updated = await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { orderId },
      data: {
        status: data.status,
        externalId: data.externalId,
        externalStatus: data.externalStatus,
        paidAt: data.status === "PAID" ? new Date() : order.payment!.paidAt,
      },
    });

    if (shouldConfirmOrder) {
      return tx.order.update({ where: { id: orderId }, data: { status: "CONFIRMED" } });
    }
    return order;
  });

  if (shouldConfirmOrder) {
    const user = await prisma.user.findUnique({
      where: { id: order.userId },
      select: { name: true, email: true },
    });
    if (user) {
      await notificationService.sendOrderStatusUpdateEmail(updated, user, "CONFIRMED");
    }
  }

  return updated;
}
