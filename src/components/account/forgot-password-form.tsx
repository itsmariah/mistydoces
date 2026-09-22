"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { requestPasswordReset } from "@/actions/auth";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  function onSubmit(data: ForgotPasswordInput) {
    startTransition(async () => {
      // Sempre mostra a mesma mensagem de sucesso, exista ou não o e-mail
      // (a Server Action nunca revela isso — evita enumeração de contas).
      await requestPasswordReset(data);
      setSent(true);
    });
  }

  if (sent) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Se houver uma conta com esse e-mail, enviamos um link para redefinir a senha. Confira
        também a caixa de spam.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Enviando..." : "Enviar link de redefinição"}
      </Button>
    </form>
  );
}
