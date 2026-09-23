"use client";

import { useState, useTransition, type FocusEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Address } from "@/generated/prisma/client";
import { useCart } from "@/components/cart/cart-provider";
import { createOrder, validateCoupon } from "@/actions/orders";
import {
  addressSchema,
  checkoutFormSchema,
  type CheckoutFormInput,
} from "@/validations/order";
import { lookupCep } from "@/lib/cep";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatCurrency } from "@/lib/utils";

const NEW_ADDRESS_VALUE = "new";

const PAYMENT_LABELS: Record<CheckoutFormInput["paymentMethod"], string> = {
  CASH: "Dinheiro na entrega/retirada",
  PIX_MANUAL: "Pix (chave enviada após o pedido)",
  CARD_ON_DELIVERY: "Cartão na entrega/retirada",
  PIX_ONLINE: "Pix online (aprovação automática)",
};

const ONLINE_PAYMENT_METHODS: CheckoutFormInput["paymentMethod"][] = ["PIX_ONLINE"];

export function CheckoutForm({
  addresses,
  deliveryFee,
}: {
  addresses: Address[];
  deliveryFee: number;
}) {
  const router = useRouter();
  const { items, subtotal, clear } = useCart();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [cepStatus, setCepStatus] = useState<"idle" | "loading" | "not-found">("idle");
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplyingCoupon, startApplyingCoupon] = useTransition();
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(
    null,
  );

  const defaultAddressId = addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id;

  const {
    control,
    register,
    handleSubmit,
    setValue,
    setFocus,
    setError,
    formState: { errors },
  } = useForm<CheckoutFormInput>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      deliveryType: "DELIVERY",
      addressId: defaultAddressId ?? NEW_ADDRESS_VALUE,
      paymentMethod: "CASH",
    },
  });

  const deliveryType = useWatch({ control, name: "deliveryType" });
  const addressChoice = useWatch({ control, name: "addressId" });
  const showNewAddressFields =
    deliveryType === "DELIVERY" && (addressChoice === NEW_ADDRESS_VALUE || addresses.length === 0);

  const effectiveDeliveryFee = deliveryType === "DELIVERY" ? deliveryFee : 0;
  const discount = appliedCoupon ? Math.min(appliedCoupon.discount, subtotal) : 0;
  const total = subtotal - discount + effectiveDeliveryFee;

  const newAddressZipCodeField = register("newAddress.zipCode");

  function handleApplyCoupon() {
    setCouponError(null);
    const code = couponCodeInput.trim();
    if (!code) {
      setCouponError("Informe um código de cupom.");
      return;
    }

    startApplyingCoupon(async () => {
      const result = await validateCoupon({ code, subtotal });
      if (!result.success) {
        setCouponError(result.error.message);
        return;
      }
      setAppliedCoupon({ code: code.toUpperCase(), discount: result.data.discount });
    });
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponCodeInput("");
    setCouponError(null);
  }

  async function handleCepBlur(event: FocusEvent<HTMLInputElement>) {
    const digits = event.target.value.replace(/\D/g, "");
    if (digits.length !== 8) return;

    setCepStatus("loading");
    const result = await lookupCep(digits);
    if (!result) {
      setCepStatus("not-found");
      return;
    }

    setCepStatus("idle");
    setValue("newAddress.street", result.street, { shouldValidate: true });
    setValue("newAddress.neighborhood", result.neighborhood, { shouldValidate: true });
    setValue("newAddress.city", result.city, { shouldValidate: true });
    setValue("newAddress.state", result.state, { shouldValidate: true });
    setFocus("newAddress.number");
  }

  function onSubmit(data: CheckoutFormInput) {
    setFormError(null);

    if (items.length === 0) {
      setFormError("Seu carrinho está vazio.");
      return;
    }

    let addressId: string | undefined;
    let newAddress: CheckoutFormInput["newAddress"] | undefined;

    if (data.deliveryType === "DELIVERY") {
      if (showNewAddressFields) {
        const parsedAddress = addressSchema.safeParse(data.newAddress);
        if (!parsedAddress.success) {
          for (const issue of parsedAddress.error.issues) {
            const field = issue.path[0];
            if (typeof field === "string") {
              setError(`newAddress.${field as keyof typeof addressSchema.shape}`, {
                type: "manual",
                message: issue.message,
              });
            }
          }
          setFormError("Verifique os campos do endereço.");
          return;
        }
        newAddress = parsedAddress.data;
      } else {
        addressId = data.addressId;
      }
    }

    startTransition(async () => {
      const result = await createOrder({
        items: items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        deliveryType: data.deliveryType,
        addressId,
        newAddress,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        couponCode: appliedCoupon?.code,
      });

      if (!result.success) {
        setFormError(result.error.message);
        return;
      }

      clear();
      const destination = ONLINE_PAYMENT_METHODS.includes(data.paymentMethod)
        ? `/conta/pedidos/${result.data.orderId}/pagamento`
        : `/conta/pedidos/${result.data.orderId}`;
      router.push(destination);
    });
  }

  if (items.length === 0) {
    return (
      <div className="space-y-4 rounded-lg border border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Seu carrinho está vazio. Adicione alguns doces antes de finalizar o pedido.
        </p>
        <Button nativeButton={false} render={<Link href="/cardapio" />}>
          Ver cardápio
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
      <section className="space-y-3">
        <h2 className="font-heading text-lg font-medium">Itens do pedido</h2>
        <div className="space-y-2 rounded-lg border border-border p-4">
          {items.map((item) => (
            <div key={item.variantId} className="flex justify-between text-sm">
              <span>
                {item.quantity}x {item.productName} ({item.variantLabel})
              </span>
              <span className="text-muted-foreground">
                {formatCurrency(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-medium">Entrega ou retirada</h2>
        <Controller
          control={control}
          name="deliveryType"
          render={({ field }) => (
            <RadioGroup value={field.value} onValueChange={field.onChange}>
              <Label className="flex items-center gap-2">
                <RadioGroupItem value="DELIVERY" />
                Entrega
              </Label>
              <Label className="flex items-center gap-2">
                <RadioGroupItem value="PICKUP" />
                Retirada no local
              </Label>
            </RadioGroup>
          )}
        />
      </section>

      {deliveryType === "DELIVERY" && (
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-medium">Endereço de entrega</h2>

          {addresses.length > 0 && (
            <Controller
              control={control}
              name="addressId"
              render={({ field }) => (
                <RadioGroup value={field.value} onValueChange={field.onChange}>
                  {addresses.map((address) => (
                    <Label key={address.id} className="flex items-start gap-2">
                      <RadioGroupItem value={address.id} className="mt-0.5" />
                      <span className="text-sm">
                        <span className="font-medium">{address.label}</span> —{" "}
                        {address.street}, {address.number}
                        {address.complement ? `, ${address.complement}` : ""} —{" "}
                        {address.neighborhood}, {address.city}/{address.state}
                      </span>
                    </Label>
                  ))}
                  <Label className="flex items-center gap-2">
                    <RadioGroupItem value={NEW_ADDRESS_VALUE} />
                    Usar um novo endereço
                  </Label>
                </RadioGroup>
              )}
            />
          )}

          {showNewAddressFields && (
            <div className="grid grid-cols-2 gap-4 rounded-lg border border-border p-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="newAddress.label">Nome do endereço</Label>
                <Input
                  id="newAddress.label"
                  placeholder="Casa, trabalho..."
                  {...register("newAddress.label")}
                />
                {errors.newAddress?.label && (
                  <p className="text-sm text-destructive">{errors.newAddress.label.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newAddress.zipCode">CEP</Label>
                <Input
                  id="newAddress.zipCode"
                  placeholder="00000-000"
                  inputMode="numeric"
                  {...newAddressZipCodeField}
                  onBlur={(event) => {
                    newAddressZipCodeField.onBlur(event);
                    handleCepBlur(event);
                  }}
                />
                {cepStatus === "loading" && (
                  <p className="text-sm text-muted-foreground">Buscando endereço...</p>
                )}
                {cepStatus === "not-found" && (
                  <p className="text-sm text-muted-foreground">
                    CEP não encontrado — preencha o endereço manualmente.
                  </p>
                )}
                {errors.newAddress?.zipCode && (
                  <p className="text-sm text-destructive">
                    {errors.newAddress.zipCode.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newAddress.number">Número</Label>
                <Input id="newAddress.number" {...register("newAddress.number")} />
                {errors.newAddress?.number && (
                  <p className="text-sm text-destructive">{errors.newAddress.number.message}</p>
                )}
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="newAddress.street">Rua</Label>
                <Input id="newAddress.street" {...register("newAddress.street")} />
                {errors.newAddress?.street && (
                  <p className="text-sm text-destructive">{errors.newAddress.street.message}</p>
                )}
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="newAddress.complement">Complemento</Label>
                <Input
                  id="newAddress.complement"
                  placeholder="Apto, bloco, quadra..."
                  {...register("newAddress.complement")}
                />
                {errors.newAddress?.complement && (
                  <p className="text-sm text-destructive">
                    {errors.newAddress.complement.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newAddress.neighborhood">Bairro</Label>
                <Input id="newAddress.neighborhood" {...register("newAddress.neighborhood")} />
                {errors.newAddress?.neighborhood && (
                  <p className="text-sm text-destructive">
                    {errors.newAddress.neighborhood.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newAddress.city">Cidade</Label>
                <Input id="newAddress.city" {...register("newAddress.city")} />
                {errors.newAddress?.city && (
                  <p className="text-sm text-destructive">{errors.newAddress.city.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newAddress.state">UF</Label>
                <Input id="newAddress.state" maxLength={2} {...register("newAddress.state")} />
                {errors.newAddress?.state && (
                  <p className="text-sm text-destructive">{errors.newAddress.state.message}</p>
                )}
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="newAddress.reference">Ponto de referência</Label>
                <Input
                  id="newAddress.reference"
                  placeholder="Nome do prédio, condomínio, estabelecimento próximo..."
                  {...register("newAddress.reference")}
                />
                {errors.newAddress?.reference && (
                  <p className="text-sm text-destructive">
                    {errors.newAddress.reference.message}
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-medium">Forma de pagamento</h2>
        <Controller
          control={control}
          name="paymentMethod"
          render={({ field }) => (
            <RadioGroup value={field.value} onValueChange={field.onChange}>
              {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                <Label key={value} className="flex items-center gap-2">
                  <RadioGroupItem value={value} />
                  {label}
                </Label>
              ))}
            </RadioGroup>
          )}
        />
      </section>

      <section className="space-y-1.5">
        <Label htmlFor="notes">Observações (opcional)</Label>
        <Textarea
          id="notes"
          placeholder="Ex.: retirar embalagem para presente, sem açúcar, etc."
          {...register("notes")}
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-medium">Cupom de desconto</h2>
        {appliedCoupon ? (
          <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
            <span>
              Cupom <span className="font-mono font-medium">{appliedCoupon.code}</span> aplicado
              — {formatCurrency(appliedCoupon.discount)} de desconto
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={handleRemoveCoupon}>
              Remover
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder="Código do cupom"
              value={couponCodeInput}
              onChange={(event) => setCouponCodeInput(event.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              disabled={isApplyingCoupon}
              onClick={handleApplyCoupon}
            >
              {isApplyingCoupon ? "Aplicando..." : "Aplicar"}
            </Button>
          </div>
        )}
        {couponError && <p className="text-sm text-destructive">{couponError}</p>}
      </section>

      <section className="space-y-2 rounded-lg border border-border p-4">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm text-primary">
            <span>Desconto</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span>Taxa de entrega</span>
          <span>{effectiveDeliveryFee > 0 ? formatCurrency(effectiveDeliveryFee) : "Grátis"}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
          <span>Total</span>
          <span className="text-primary">{formatCurrency(total)}</span>
        </div>
      </section>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "Enviando pedido..." : "Confirmar pedido"}
      </Button>
    </form>
  );
}
