"use client";

import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { formatPhoneInput } from "@/lib/phone";

/**
 * Campo de telefone com máscara "(83) 99999-9999". Funciona com o `register` do
 * react-hook-form: formata o valor no próprio evento antes de repassar o `onChange`.
 */
export function PhoneInput({ onChange, ...props }: ComponentProps<typeof Input>) {
  return (
    <Input
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      placeholder="(83) 99999-9999"
      maxLength={16}
      {...props}
      onChange={(event) => {
        event.target.value = formatPhoneInput(event.target.value);
        onChange?.(event);
      }}
    />
  );
}
