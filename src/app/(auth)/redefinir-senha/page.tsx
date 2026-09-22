import Link from "next/link";
import { ResetPasswordForm } from "@/components/account/reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="font-heading text-xl font-semibold">Link inválido</h1>
        <p className="text-sm text-muted-foreground">
          Este link de redefinição de senha está incompleto ou inválido.
        </p>
        <Link href="/esqueci-senha" className="font-medium text-primary hover:underline">
          Solicitar um novo link
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="font-heading text-xl font-semibold">Redefinir senha</h1>
        <p className="text-sm text-muted-foreground">Escolha uma nova senha para sua conta.</p>
      </div>

      <ResetPasswordForm token={token} />
    </div>
  );
}
