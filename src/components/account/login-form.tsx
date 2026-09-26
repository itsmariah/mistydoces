"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

// O proxy manda o callbackUrl como URL absoluta; só aceita destinos do próprio site
// (evita open redirect) e ignora o próprio /login.
function safeCallbackPath(callbackUrl: string | undefined): string | null {
  if (!callbackUrl) return null;
  try {
    const url = new URL(callbackUrl, window.location.origin);
    if (url.origin !== window.location.origin || url.pathname === "/login") return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  function onSubmit(data: LoginInput) {
    setFormError(null);
    startTransition(async () => {
      const result = await signIn("credentials", {
        ...data,
        redirect: false,
      });

      if (!result || result.error) {
        setFormError("E-mail ou senha inválidos.");
        return;
      }

      const session = await getSession();
      const fallback = session?.user?.role === "ADMIN" ? "/admin" : "/conta";
      router.push(safeCallbackPath(callbackUrl) ?? fallback);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Senha</Label>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
