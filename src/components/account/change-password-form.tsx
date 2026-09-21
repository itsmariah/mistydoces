"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePassword } from "@/actions/profile";
import { changePasswordSchema, type ChangePasswordInput } from "@/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangePasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) });

  function onSubmit(data: ChangePasswordInput) {
    setFeedback(null);
    startTransition(async () => {
      const result = await changePassword(data);
      if (result.success) {
        setFeedback({ type: "success", message: "Senha alterada com sucesso." });
        reset();
      } else {
        setFeedback({ type: "error", message: result.error.message });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="currentPassword">Senha atual</Label>
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          {...register("currentPassword")}
        />
        {errors.currentPassword && (
          <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
        )}
      </div>

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

      {feedback && (
        <p
          className={
            feedback.type === "success" ? "text-sm text-primary" : "text-sm text-destructive"
          }
        >
          {feedback.message}
        </p>
      )}

      <Button type="submit" variant="outline" disabled={isPending}>
        {isPending ? "Alterando..." : "Alterar senha"}
      </Button>
    </form>
  );
}
