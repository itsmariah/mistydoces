import type { OrderStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ForbiddenError,
  InvalidStatusTransitionError,
  NotFoundError,
  ProductUnavailableError,
} from "@/lib/errors";
import { canCustomerCancel, canTransition } from "@/lib/order-status";
import { getDeliveryFee } from "@/services/store-settings-service";
import type { CheckoutInput } from "@/validations/order";

// Preços são manipulados em centavos (inteiros) durante o cálculo para evitar
// erros de ponto flutuante; convertidos de volta para reais só ao persistir.
function toCents(value: unknown): number {
  return Math.round(Number(value) * 100);
}

function fromCents(cents: number): number {
  return cents / 100;
}

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
    include: { product: true },
  });

  let subtotalCents = 0;
  const orderItemsData = input.items.map((item) => {
    const variant = variants.find((v) => v.id === item.variantId);
    if (!variant) {
      throw new NotFoundError("Um dos itens do carrinho não existe mais.");
    }
    if (!variant.product.isActive || !variant.product.isAvailable) {
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
  const totalCents = subtotalCents + deliveryFeeCents;

  const order = await prisma.order.create({
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
      notes: input.notes || null,
      subtotal: fromCents(subtotalCents),
      deliveryFee: fromCents(deliveryFeeCents),
      total: fromCents(totalCents),
      items: { create: orderItemsData },
      payment: { create: { method: input.paymentMethod } },
    },
    include: { items: true, payment: true },
  });

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

  return prisma.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED" },
  });
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
  if (!canTransition(order.status, status)) {
    throw new InvalidStatusTransitionError(order.status, status);
  }

  return prisma.order.update({ where: { id: orderId }, data: { status } });
}

export async function adminMarkPaymentPaid(orderId: string) {
  const payment = await prisma.payment.findUnique({ where: { orderId } });
  if (!payment) throw new NotFoundError("Pagamento não encontrado.");

  return prisma.payment.update({
    where: { orderId },
    data: { status: "PAID", paidAt: new Date() },
  });
}
