"use client";

import { useState, useTransition, type ComponentProps, type ReactNode } from "react";
import { Controller, useForm, useWatch, type FieldPath } from "react-hook-form";
import { X } from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateStoreSettings } from "@/actions/store-settings";
import {
  storeSettingsSchema,
  type StoreSettingsFormValues,
  type StoreSettingsInput,
} from "@/validations/store-settings";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toDayKey } from "@/lib/store-time";
import { cn } from "@/lib/utils";

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
// Mesma ordem do site: a semana da loja começa na segunda.
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

const blockedDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

function formatBlockedDate(dayKey: string) {
  return blockedDateFormatter.format(new Date(`${dayKey}T12:00:00Z`));
}

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
    <SectionCard as="fieldset" title={title} description={description}>
      {children}
    </SectionCard>
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
    setValue,
    control,
    formState: { errors },
  } = useForm<StoreSettingsFormValues, unknown, StoreSettingsInput>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues,
  });
  const weeklyHours = useWatch({ control, name: "weeklyHours" });
  const blockedDates = useWatch({ control, name: "blockedDates" });
  const [newBlockedDate, setNewBlockedDate] = useState("");
  const today = toDayKey(new Date());

  function addBlockedDate() {
    if (!newBlockedDate || blockedDates.includes(newBlockedDate)) return;
    setValue("blockedDates", [...blockedDates, newBlockedDate].sort(), { shouldDirty: true });
    setNewBlockedDate("");
  }

  function removeBlockedDate(dayKey: string) {
    setValue(
      "blockedDates",
      blockedDates.filter((item) => item !== dayKey),
      { shouldDirty: true },
    );
  }

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
    name: Exclude<
      FieldPath<StoreSettingsFormValues>,
      | "deliveryFee"
      | "prepMinutes"
      | "maxAdvanceDays"
      | `weeklyHours${string}`
      | `blockedDates${string}`
    >,
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
        description="Endereço mostrado para quem escolhe retirar o pedido."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {field("street", "Rua e número", { placeholder: "Rua das Flores, 123", wide: true })}
          {field("city", "Cidade")}
          <div className="grid grid-cols-[5rem_1fr] gap-4">
            {field("state", "UF", { maxLength: 2, placeholder: "PB" })}
            {field("zipCode", "CEP", { inputMode: "numeric", placeholder: "58000-000" })}
          </div>
        </div>
      </Section>

      <Section
        title="Horário de funcionamento"
        description="Define o “Aberto agora” do site e as janelas que o cliente pode escolher para entrega ou retirada."
      >
        <ul className="divide-y divide-border">
          {WEEK_ORDER.map((day) => {
            const enabled = weeklyHours[day]?.enabled;
            const error = errors.weeklyHours?.[day]?.close?.message;
            return (
              <li key={day} className="space-y-1 py-2.5 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <Label className="w-28 cursor-pointer gap-2">
                    <Controller
                      control={control}
                      name={`weeklyHours.${day}.enabled`}
                      render={({ field }) => (
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => field.onChange(checked === true)}
                        />
                      )}
                    />
                    {DAY_NAMES[day]}
                  </Label>
                  {enabled ? (
                    <div className="flex items-center gap-2 text-sm">
                      <Input
                        type="time"
                        aria-label={`${DAY_NAMES[day]}: abre às`}
                        className="w-28"
                        {...register(`weeklyHours.${day}.open`)}
                      />
                      às
                      <Input
                        type="time"
                        aria-label={`${DAY_NAMES[day]}: fecha às`}
                        aria-invalid={Boolean(error)}
                        className="w-28"
                        {...register(`weeklyHours.${day}.close`)}
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Fechado</span>
                  )}
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </li>
            );
          })}
        </ul>
        <div className="space-y-1.5">
          <Label htmlFor="hoursNote">Observação (opcional)</Label>
          <Input id="hoursNote" placeholder="Feriados sob consulta" {...register("hoursNote")} />
          {errors.hoursNote && (
            <p className="text-sm text-destructive">{errors.hoursNote.message}</p>
          )}
        </div>
      </Section>

      <Section
        title="Agendamento"
        description="Regras para a data e o horário que o cliente escolhe no checkout."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="prepMinutes">Tempo mínimo de preparo (min)</Label>
            <Input
              id="prepMinutes"
              type="number"
              min="0"
              step="15"
              aria-invalid={Boolean(errors.prepMinutes)}
              {...register("prepMinutes", { valueAsNumber: true })}
            />
            {errors.prepMinutes ? (
              <p className="text-sm text-destructive">{errors.prepMinutes.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Intervalo entre o pedido e a primeira janela disponível.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="maxAdvanceDays">Agendar até quantos dias à frente</Label>
            <Input
              id="maxAdvanceDays"
              type="number"
              min="1"
              aria-invalid={Boolean(errors.maxAdvanceDays)}
              {...register("maxAdvanceDays", { valueAsNumber: true })}
            />
            {errors.maxAdvanceDays && (
              <p className="text-sm text-destructive">{errors.maxAdvanceDays.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="newBlockedDate">Dias sem atendimento</Label>
          <p className="text-xs text-muted-foreground">
            Feriados, folgas ou férias: nesses dias a loja aparece fechada e não recebe agendamentos.
          </p>
          <div className="flex gap-2">
            <Input
              id="newBlockedDate"
              type="date"
              min={today}
              className="w-44"
              value={newBlockedDate}
              onChange={(event) => setNewBlockedDate(event.target.value)}
              onKeyDown={(event) => {
                // Enter adiciona a data em vez de salvar o formulário inteiro.
                if (event.key === "Enter") {
                  event.preventDefault();
                  addBlockedDate();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={addBlockedDate}
              disabled={!newBlockedDate}
            >
              Adicionar
            </Button>
          </div>
          {blockedDates.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {blockedDates.map((dayKey) => (
                <li
                  key={dayKey}
                  className={cn(
                    "flex items-center gap-1 rounded-full bg-secondary py-1 pr-1 pl-3 text-sm text-secondary-foreground",
                    // Datas que já passaram não fazem mal, só ficam apagadas até alguém remover.
                    dayKey < today && "opacity-60",
                  )}
                >
                  <span className="capitalize">{formatBlockedDate(dayKey)}</span>
                  <button
                    type="button"
                    onClick={() => removeBlockedDate(dayKey)}
                    aria-label={`Remover ${formatBlockedDate(dayKey)}`}
                    className="flex size-6 items-center justify-center rounded-full hover:bg-background/60"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
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
        {isPending ? "Salvando…" : "Salvar alterações"}
      </Button>
    </form>
  );
}
