"use client";

import { useState, useTransition, type ComponentProps, type ReactNode } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateStoreSettings } from "@/actions/store-settings";
import {
  storeSettingsSchema,
  type StoreSettingsFormValues,
  type StoreSettingsInput,
} from "@/validations/store-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="space-y-4 rounded-lg border border-border p-4">
      <legend className="px-1 font-heading text-lg font-medium">{title}</legend>
      <p className="-mt-2 text-sm text-muted-foreground">{description}</p>
      {children}
    </fieldset>
  );
}

export function StoreSettingsForm({
  defaultValues,
}: {
  defaultValues: StoreSettingsFormValues;
}) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<StoreSettingsFormValues, unknown, StoreSettingsInput>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues,
  });

  function onSubmit() {
    setFormError(null);
    startTransition(async () => {
      // Envia os valores crus do formulário: a action valida e normaliza de novo no servidor.
      const result = await updateStoreSettings(getValues());
      if (!result.success) {
        setFormError(result.error.message);
        return;
      }
      toast.success("Configurações salvas.");
    });
  }

  function field(
    name: Exclude<FieldPath<StoreSettingsFormValues>, "deliveryFee">,
    label: string,
    props: ComponentProps<typeof Input> & { hint?: string; wide?: boolean } = {},
  ) {
    const { hint, wide, ...inputProps } = props;
    const error = errors[name]?.message;
    return (
      <div className={cn("space-y-1.5", wide && "sm:col-span-2")}>
        <Label htmlFor={name}>{label}</Label>
        <Input id={name} aria-invalid={Boolean(error)} {...inputProps} {...register(name)} />
        {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6" noValidate>
      <Section title="Loja" description="Nome e apresentação que aparecem no rodapé do site.">
        {field("storeName", "Nome da loja")}
        <div className="space-y-1.5">
          <Label htmlFor="description">Descrição curta</Label>
          <Textarea
            id="description"
            rows={2}
            placeholder="Doces artesanais feitos com carinho, do pedido à entrega."
            {...register("description")}
          />
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description.message}</p>
          )}
        </div>
      </Section>

      <Section
        title="Contato"
        description="Canais exibidos na página Contato e no rodapé. Deixe em branco o que a loja não usa."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {field("whatsapp", "WhatsApp", {
            inputMode: "tel",
            placeholder: "(83) 99999-9999",
            hint: "O botão do site já abre a conversa com uma mensagem pronta.",
          })}
          {field("phone", "Telefone", { inputMode: "tel", placeholder: "(83) 3333-3333" })}
          {field("email", "E-mail", { type: "email", placeholder: "contato@mistydoces.com.br" })}
          {field("instagram", "Instagram", {
            placeholder: "@mistydoces",
            hint: "Pode colar o link do perfil ou só o usuário.",
          })}
        </div>
      </Section>

      <Section
        title="Retirada no local"
        description="Endereço e horário mostrados para quem escolhe retirar o pedido."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {field("street", "Rua e número", { placeholder: "Rua das Flores, 123", wide: true })}
          {field("city", "Cidade")}
          <div className="grid grid-cols-[5rem_1fr] gap-4">
            {field("state", "UF", { maxLength: 2, placeholder: "PB" })}
            {field("zipCode", "CEP", { inputMode: "numeric", placeholder: "58000-000" })}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="openingHours">Horário de funcionamento</Label>
          <Textarea
            id="openingHours"
            rows={3}
            placeholder={"Ter a sex: 9h às 18h\nSáb: 9h às 13h"}
            {...register("openingHours")}
          />
          {errors.openingHours ? (
            <p className="text-sm text-destructive">{errors.openingHours.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Uma linha por período. Aparece como está.</p>
          )}
        </div>
      </Section>

      <Section title="Entrega" description="Valor somado aos pedidos com entrega.">
        <div className="max-w-48 space-y-1.5">
          <Label htmlFor="deliveryFee">Taxa de entrega (R$)</Label>
          <Input
            id="deliveryFee"
            type="number"
            step="0.01"
            min="0"
            {...register("deliveryFee", { valueAsNumber: true })}
          />
          {errors.deliveryFee && (
            <p className="text-sm text-destructive">{errors.deliveryFee.message}</p>
          )}
        </div>
      </Section>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar alterações"}
      </Button>
    </form>
  );
}
