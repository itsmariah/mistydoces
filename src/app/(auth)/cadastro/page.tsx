import Link from "next/link";
import { RegisterForm } from "@/components/account/register-form";

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="font-heading text-xl font-semibold">Criar conta</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre-se para fazer pedidos e acompanhar o status em tempo real.
        </p>
      </div>

      <RegisterForm />

      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
