"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPassword } from "@/actions/auth";
import { resetPasswordSchema, type ResetPasswordInput } from "@/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  function onSubmit(data: ResetPasswordInput) {
    setFormError(null);
    startTransition(async () => {
      const result = await resetPassword(data);
      if (!result.success) {
        setFormError(result.error.message);
        return;
      }
      router.push("/login");
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <input type="hidden" {...register("token")} />

      <div className="space-y-1.5">
        <Label htmlFor="newPassword">Nova senha</Label>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          {...register("newPassword")}
        />
        {errors.newPassword && (
          <p className="text-sm text-destructive">{errors.newPassword.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmNewPassword">Confirmar nova senha</Label>
        <Input
          id="confirmNewPassword"
          type="password"
          autoComplete="new-password"
          {...register("confirmNewPassword")}
        />
        {errors.confirmNewPassword && (
          <p className="text-sm text-destructive">{errors.confirmNewPassword.message}</p>
        )}
      </div>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Salvando..." : "Redefinir senha"}
      </Button>
    </form>
  );
}
