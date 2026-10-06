"use client";

import {
  useEffect,
  useState,
  useTransition,
  type ComponentProps,
  type FocusEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Banknote,
  CalendarClock,
  CreditCard,
  MapPin,
  Plus,
  QrCode,
  ShieldCheck,
  Smartphone,
  Store,
  Truck,
  type LucideIcon,
} from "lucide-react";
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
import { RadioGroup } from "@/components/ui/radio-group";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductPlaceholderImage } from "@/components/catalog/product-placeholder-image";
import { CheckoutSteps, type CheckoutStep } from "@/components/checkout/checkout-steps";
import { OptionCard } from "@/components/checkout/option-card";
import { SchedulePicker } from "@/components/checkout/schedule-picker";
import { ItemNote } from "@/components/orders/item-note";
import { cartLineKey } from "@/lib/cart";
import { formatScheduledFor, maxLeadTimeDays, type SchedulingRules } from "@/lib/scheduling";
import { PickupDetails } from "@/components/shared/pickup-details";
import type { PickupInfo } from "@/lib/store-contact";
import { cn, formatCurrency } from "@/lib/utils";

const NEW_ADDRESS_VALUE = "new";

type PaymentMethod = CheckoutFormInput["paymentMethod"];

// Separados em dois grupos para deixar claro quando o dinheiro sai: agora (online) ou depois, com a loja.
const PAYMENT_GROUPS: {
  title: string;
  options: { value: PaymentMethod; icon: LucideIcon; title: string; description: string }[];
}[] = [
  {
    title: "Pague agora, online",
    options: [
      {
        value: "PIX_ONLINE",
        icon: QrCode,
        title: "Pix online",
        description: "QR Code na hora, aprovação automática",
      },
      {
        value: "CARD_ONLINE",
        icon: CreditCard,
        title: "Cartão de crédito",
        description: "Pagamento seguro pelo Mercado Pago",
      },
    ],
  },
  {
    title: "Combine com a loja",
    options: [
      {
        value: "PIX_MANUAL",
        icon: Smartphone,
        title: "Pix pela loja",
        description: "A chave chega depois do pedido",
      },
      {
        value: "CASH",
        icon: Banknote,
        title: "Dinheiro",
        description: "Na entrega ou na retirada",
      },
      {
        value: "CARD_ON_DELIVERY",
        icon: CreditCard,
        title: "Cartão na maquininha",
        description: "Na entrega ou na retirada",
      },
    ],
  },
];

// Ordem dos campos na tela: ao enviar com erro, o foco vai para o primeiro inválido de cima para baixo.
const ADDRESS_FIELD_ORDER = [
  "label",
  "zipCode",
  "number",
  "street",
  "complement",
  "neighborhood",
  "city",
  "state",
  "reference",
] as const;

type AddressFieldName = (typeof ADDRESS_FIELD_ORDER)[number];

/** Rola até o campo (no meio da tela, longe do header e da barra de etapas) e dá foco nele. */
function focusField(id: string) {
  const field = document.getElementById(id);
  if (!field) return;
  field.scrollIntoView({ block: "center" });
  field.focus({ preventScroll: true });
}

const ONLINE_PAYMENT_METHODS: CheckoutFormInput["paymentMethod"][] = [
  "PIX_ONLINE",
  "CARD_ONLINE",
];

// Constante de módulo: o `CheckoutSteps` acompanha estas seções e não deve reiniciar a cada render.
const CHECKOUT_STEPS: CheckoutStep[] = [
  { id: "etapa-itens", label: "Itens" },
  { id: "etapa-entrega", label: "Entrega" },
  { id: "etapa-quando", label: "Quando" },
  { id: "etapa-pagamento", label: "Pagamento" },
  { id: "etapa-revisao", label: "Revisão" },
];

export function CheckoutForm({
  addresses,
  deliveryFee,
  pickup,
  schedulingRules,
}: {
  addresses: Address[];
  deliveryFee: number;
  /** Endereço e horário da loja; `null` se ainda não foram preenchidos no painel. */
  pickup: PickupInfo | null;
  /** Horário, folgas e preparo: de onde saem as janelas da etapa "Quando". */
  schedulingRules: SchedulingRules;
}) {
  const router = useRouter();
  const { items, subtotal, hasUnavailable, clear, refresh, isRefreshing, removeItem } = useCart();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [cepStatus, setCepStatus] = useState<"idle" | "loading" | "not-found">("idle");
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplyingCoupon, startApplyingCoupon] = useTransition();
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(
    null,
  );
  // Trocar a `key` remonta a escolha de horário com o relógio de agora (ver SLOT_UNAVAILABLE).
  const [schedulePickerKey, setSchedulePickerKey] = useState(0);

  // Confere preços e disponibilidade ao chegar no checkout: o carrinho pode ter
  // sido montado há dias, e o total mostrado aqui precisa ser o que será cobrado.
  useEffect(() => {
    void refresh();
  }, [refresh]);

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
  const paymentMethod = useWatch({ control, name: "paymentMethod" });
  const scheduledFor = useWatch({ control, name: "scheduledFor" });

  // O item mais demorado define o primeiro dia possível para o pedido inteiro.
  const leadTimeDays = maxLeadTimeDays(items);
  const leadProductNames =
    leadTimeDays > 0
      ? [...new Set(items.filter((item) => item.leadTimeDays === leadTimeDays).map((item) => item.productName))]
      : [];
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
    if (hasUnavailable) {
      setFormError("Remova os itens indisponíveis para finalizar o pedido.");
      return;
    }

    let addressId: string | undefined;
    let newAddress: CheckoutFormInput["newAddress"] | undefined;

    if (data.deliveryType === "DELIVERY") {
      if (showNewAddressFields) {
        const parsedAddress = addressSchema.safeParse(data.newAddress);
        if (!parsedAddress.success) {
          const invalidFields = new Set<string>();
          for (const issue of parsedAddress.error.issues) {
            const field = issue.path[0];
            if (typeof field === "string") {
              invalidFields.add(field);
              setError(`newAddress.${field as AddressFieldName}`, {
                type: "manual",
                message: issue.message,
              });
            }
          }
          setFormError("Verifique os campos do endereço.");
          // Estes erros são marcados à mão, então o react-hook-form não move o foco sozinho.
          const firstInvalid = ADDRESS_FIELD_ORDER.find((field) => invalidFields.has(field));
          if (firstInvalid) focusField(`newAddress.${firstInvalid}`);
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
          note: item.note || undefined,
        })),
        deliveryType: data.deliveryType,
        addressId,
        newAddress,
        paymentMethod: data.paymentMethod,
        scheduledFor: data.scheduledFor,
        notes: data.notes,
        couponCode: appliedCoupon?.code,
      });

      if (!result.success) {
        setFormError(result.error.message);
        // Algo saiu do cardápio entre a conferência e o envio: atualiza para mostrar o quê.
        if (result.error.code === "PRODUCT_UNAVAILABLE" || result.error.code === "NOT_FOUND") {
          void refresh();
        }
        // A janela passou enquanto a pessoa preenchia: remontar o seletor recalcula as janelas
        // com o relógio de agora, e ele mesmo troca a marcada pela próxima livre.
        if (result.error.code === "SLOT_UNAVAILABLE") {
          setSchedulePickerKey((key) => key + 1);
          focusField("etapa-quando");
        }
        return;
      }

      clear();
      const destination = ONLINE_PAYMENT_METHODS.includes(data.paymentMethod)
        ? `/conta/pedidos/${result.data.orderId}/pagamento`
        : `/conta/pedidos/${result.data.orderId}?novo=1`;
      router.push(destination);
    });
  }

  if (items.length === 0) {
    return (
      <EmptyState
        image={{ src: "/branding/02_gatinha_dormindo.png", width: 160, height: 131 }}
        title="Carrinho vazio"
        description="Adicione alguns doces antes de finalizar o pedido."
        action={
          <Button nativeButton={false} render={<Link href="/cardapio" />}>
            Ver cardápio
          </Button>
        }
        className="mx-auto max-w-2xl rounded-lg border border-border"
      />
    );
  }

  const addressError = (field: AddressFieldName) => errors.newAddress?.[field]?.message;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-10"
      noValidate
    >
      <div className="space-y-8">
        <CheckoutSteps
          steps={CHECKOUT_STEPS}
          trailing={
            // No desktop o resumo fica fixo ao lado; no celular o total viaja na barra de etapas.
            <a
              href="#resumo"
              className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground lg:hidden"
            >
              <span className="sr-only">Total: </span>
              {formatCurrency(total)}
            </a>
          }
        />

        {/* `scroll-mt-36` nos inícios de etapa compensa o header + a barra de etapas fixos. */}
        <section id="etapa-itens" className="scroll-mt-36 space-y-3">
          <h2 className="font-heading text-lg font-medium">Itens do pedido</h2>
          <ul className="divide-y divide-border rounded-xl border border-border bg-card px-4">
            {items.map((item) => (
              <li key={cartLineKey(item)} className="flex items-center gap-3 py-3 text-sm">
                <div
                  className={cn(
                    "relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted",
                    !item.isAvailable && "opacity-50 grayscale",
                  )}
                >
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt="" fill sizes="44px" className="object-cover" />
                  ) : (
                    <ProductPlaceholderImage className="object-contain p-1" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate font-medium", !item.isAvailable && "text-muted-foreground line-through")}>
                    {item.quantity}x {item.productName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{item.variantLabel}</p>
                  <ItemNote note={item.note} />
                </div>
                {item.isAvailable ? (
                  <span className="shrink-0 text-muted-foreground">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                ) : (
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-destructive">Indisponível</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(cartLineKey(item))}
                    >
                      Remover
                    </Button>
                  </span>
                )}
              </li>
            ))}
          </ul>
          {isRefreshing && (
            <p className="text-xs text-muted-foreground">Conferindo preços e disponibilidade…</p>
          )}
        </section>

        <section id="etapa-entrega" className="scroll-mt-36 space-y-3">
          <h2 className="font-heading text-lg font-medium">Entrega ou retirada</h2>
          <Controller
            control={control}
            name="deliveryType"
            render={({ field }) => (
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                aria-label="Entrega ou retirada"
                className="sm:grid-cols-2"
              >
                <OptionCard
                  value="DELIVERY"
                  icon={Truck}
                  title="Entrega"
                  description="Levamos até o seu endereço"
                  aside={deliveryFee > 0 ? `+${formatCurrency(deliveryFee)}` : "Grátis"}
                />
                <OptionCard
                  value="PICKUP"
                  icon={Store}
                  title="Retirada"
                  description="Você busca na loja"
                  aside="Grátis"
                />
              </RadioGroup>
            )}
          />
          {deliveryType === "PICKUP" && pickup && (
            <PickupDetails pickup={pickup} className="rounded-xl border border-border p-4" />
          )}
        </section>

        {deliveryType === "DELIVERY" && (
          <section className="space-y-3">
            <h2 className="font-heading text-lg font-medium">Endereço de entrega</h2>

            {addresses.length > 0 && (
              <Controller
                control={control}
                name="addressId"
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    aria-label="Endereço de entrega"
                  >
                    {addresses.map((address) => (
                      <OptionCard
                        key={address.id}
                        value={address.id}
                        icon={MapPin}
                        title={address.label}
                        description={
                          <>
                            {address.street}, {address.number}
                            {address.complement ? `, ${address.complement}` : ""} —{" "}
                            {address.neighborhood}, {address.city}/{address.state}
                          </>
                        }
                      />
                    ))}
                    <OptionCard value={NEW_ADDRESS_VALUE} icon={Plus} title="Usar um novo endereço" />
                  </RadioGroup>
                )}
              />
            )}

            {showNewAddressFields && (
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-card p-4">
                <AddressInputField
                  id="newAddress.label"
                  label="Nome do endereço"
                  placeholder="Casa, trabalho…"
                  autoComplete="off"
                  error={addressError("label")}
                  className="col-span-2"
                  {...register("newAddress.label")}
                />
                <AddressInputField
                  id="newAddress.zipCode"
                  label="CEP"
                  placeholder="00000-000"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  error={addressError("zipCode")}
                  hint={
                    cepStatus === "loading" ? (
                      <p className="text-sm text-muted-foreground">Buscando endereço…</p>
                    ) : cepStatus === "not-found" ? (
                      <p className="text-sm text-muted-foreground">
                        CEP não encontrado — preencha o endereço manualmente.
                      </p>
                    ) : null
                  }
                  {...newAddressZipCodeField}
                  onBlur={(event) => {
                    newAddressZipCodeField.onBlur(event);
                    handleCepBlur(event);
                  }}
                />
                <AddressInputField
                  id="newAddress.number"
                  label="Número"
                  inputMode="numeric"
                  error={addressError("number")}
                  {...register("newAddress.number")}
                />
                <AddressInputField
                  id="newAddress.street"
                  label="Rua"
                  autoComplete="address-line1"
                  error={addressError("street")}
                  className="col-span-2"
                  {...register("newAddress.street")}
                />
                <AddressInputField
                  id="newAddress.complement"
                  label="Complemento"
                  placeholder="Apto, bloco, quadra…"
                  autoComplete="address-line2"
                  error={addressError("complement")}
                  className="col-span-2"
                  {...register("newAddress.complement")}
                />
                <AddressInputField
                  id="newAddress.neighborhood"
                  label="Bairro"
                  autoComplete="address-level3"
                  error={addressError("neighborhood")}
                  {...register("newAddress.neighborhood")}
                />
                <AddressInputField
                  id="newAddress.city"
                  label="Cidade"
                  autoComplete="address-level2"
                  error={addressError("city")}
                  {...register("newAddress.city")}
                />
                <AddressInputField
                  id="newAddress.state"
                  label="UF"
                  maxLength={2}
                  autoComplete="address-level1"
                  error={addressError("state")}
                  {...register("newAddress.state")}
                />
                <AddressInputField
                  id="newAddress.reference"
                  label="Ponto de referência"
                  placeholder="Nome do prédio, condomínio, estabelecimento próximo…"
                  autoComplete="off"
                  error={addressError("reference")}
                  className="col-span-2"
                  {...register("newAddress.reference")}
                />
              </div>
            )}
          </section>
        )}

        <section id="etapa-quando" tabIndex={-1} className="scroll-mt-36 space-y-3 outline-none">
          <h2 className="font-heading text-lg font-medium">
            {deliveryType === "DELIVERY" ? "Quando entregar" : "Quando retirar"}
          </h2>
          <Controller
            control={control}
            name="scheduledFor"
            render={({ field }) => (
              <SchedulePicker
                key={schedulePickerKey}
                rules={schedulingRules}
                leadTimeDays={leadTimeDays}
                leadProductNames={leadProductNames}
                deliveryType={deliveryType}
                value={field.value}
                onChange={field.onChange}
                error={errors.scheduledFor?.message}
              />
            )}
          />
        </section>

        <section id="etapa-pagamento" className="scroll-mt-36 space-y-3">
          <h2 className="font-heading text-lg font-medium">Forma de pagamento</h2>
          <Controller
            control={control}
            name="paymentMethod"
            render={({ field }) => (
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                aria-label="Forma de pagamento"
                className="gap-5"
              >
                {PAYMENT_GROUPS.map((group) => (
                  <div key={group.title} className="space-y-2">
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      {group.title}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {group.options.map((option) => (
                        <OptionCard key={option.value} {...option} />
                      ))}
                    </div>
                  </div>
                ))}
              </RadioGroup>
            )}
          />
        </section>

        {/* Início da última etapa: no desktop o resumo é fixo e não serve de marco de rolagem. */}
        <section id="etapa-revisao" className="scroll-mt-36 space-y-1.5">
          <Label htmlFor="notes">Observações (opcional)</Label>
          <Textarea
            id="notes"
            placeholder="Ex.: retirar embalagem para presente, sem açúcar, etc."
            {...register("notes")}
          />
        </section>
      </div>

      <aside
        id="resumo"
        aria-labelledby="resumo-titulo"
        className="mt-8 scroll-mt-36 space-y-5 rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-24 lg:mt-0"
      >
        <h2 id="resumo-titulo" className="font-heading text-lg font-medium">
          Resumo do pedido
        </h2>

        <div className="space-y-2">
          {appliedCoupon ? (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
              <span>
                Cupom <span className="font-mono font-medium">{appliedCoupon.code}</span> aplicado
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={handleRemoveCoupon}>
                Remover
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                aria-label="Código do cupom"
                placeholder="Cupom de desconto"
                autoComplete="off"
                className="uppercase placeholder:normal-case"
                value={couponCodeInput}
                onChange={(event) => setCouponCodeInput(event.target.value)}
                onKeyDown={(event) => {
                  // Enter aplica o cupom em vez de enviar o pedido inteiro.
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleApplyCoupon();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                disabled={isApplyingCoupon}
                onClick={handleApplyCoupon}
              >
                {isApplyingCoupon ? "Aplicando…" : "Aplicar"}
              </Button>
            </div>
          )}
          {couponError && <p className="text-sm text-destructive">{couponError}</p>}
        </div>

        {scheduledFor && (
          <p className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-sm">
            <CalendarClock className="mt-0.5 size-4 shrink-0 text-link" aria-hidden="true" />
            <span>
              <span className="block text-xs text-muted-foreground">
                {deliveryType === "DELIVERY" ? "Entrega" : "Retirada"}
              </span>
              <span className="first-letter:uppercase">{formatScheduledFor(new Date(scheduledFor))}</span>
            </span>
          </p>
        )}

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatCurrency(subtotal)}</dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-link">
              <dt>Desconto</dt>
              <dd>-{formatCurrency(discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>{deliveryType === "DELIVERY" ? "Taxa de entrega" : "Retirada"}</dt>
            <dd>{effectiveDeliveryFee > 0 ? formatCurrency(effectiveDeliveryFee) : "Grátis"}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd className="text-link">{formatCurrency(total)}</dd>
          </div>
        </dl>

        {formError && (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        )}
        {hasUnavailable && !formError && (
          <p className="text-sm text-destructive">
            Remova os itens indisponíveis (em &ldquo;Itens do pedido&rdquo;) para finalizar o pedido.
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isPending || isRefreshing || hasUnavailable}
        >
          {isPending ? "Enviando pedido…" : "Confirmar pedido"}
        </Button>

        {ONLINE_PAYMENT_METHODS.includes(paymentMethod) && (
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-px size-4 shrink-0 text-link" aria-hidden="true" />
            Pagamento processado com segurança pelo Mercado Pago. Os dados do seu cartão não passam
            pela nossa loja.
          </p>
        )}
      </aside>
    </form>
  );
}

/** Campo do endereço novo: rótulo, input e erro ligados por `aria-invalid`/`aria-describedby`. */
function AddressInputField({
  id,
  label,
  error,
  hint,
  className,
  ...inputProps
}: ComponentProps<"input"> & { id: string; label: string; error?: string; hint?: ReactNode }) {
  const errorId = `${id}-erro`;
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
      />
      {hint}
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
