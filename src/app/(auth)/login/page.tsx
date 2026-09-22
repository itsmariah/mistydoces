import Link from "next/link";
import { LoginForm } from "@/components/account/login-form";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="font-heading text-xl font-semibold">Entrar</h1>
        <p className="text-sm text-muted-foreground">
          Acesse sua conta para acompanhar seus pedidos.
        </p>
      </div>

      <LoginForm />

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/esqueci-senha" className="font-medium text-primary hover:underline">
          Esqueci minha senha
        </Link>
      </p>

      <p className="text-center text-sm text-muted-foreground">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-medium text-primary hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
