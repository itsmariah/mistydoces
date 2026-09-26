import Link from "next/link";
import { LoginForm } from "@/components/account/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="font-heading text-xl font-semibold">Entrar</h1>
        <p className="text-sm text-muted-foreground">
          Acesse sua conta para acompanhar seus pedidos.
        </p>
      </div>

      <LoginForm callbackUrl={typeof callbackUrl === "string" ? callbackUrl : undefined} />

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/esqueci-senha" className="font-medium text-link hover:underline">
          Esqueci minha senha
        </Link>
      </p>

      <p className="text-center text-sm text-muted-foreground">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-medium text-link hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
