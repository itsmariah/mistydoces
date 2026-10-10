import Link from "next/link";
import { LoginForm } from "@/components/account/login-form";
import { isCheckoutCallback, withCallbackUrl } from "@/lib/callback-url";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) {
  const { callbackUrl: rawCallbackUrl } = await searchParams;
  const callbackUrl = typeof rawCallbackUrl === "string" ? rawCallbackUrl : undefined;
  const fromCheckout = isCheckoutCallback(callbackUrl);

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="font-heading text-xl font-semibold">
          {fromCheckout ? "Entre para finalizar seu pedido" : "Entrar"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {fromCheckout
            ? "Seu carrinho fica guardado. É só entrar ou criar sua conta, e você volta direto para o pedido."
            : "Acesse sua conta para acompanhar seus pedidos."}
        </p>
      </div>

      <LoginForm callbackUrl={callbackUrl} />

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/esqueci-senha" className="font-medium text-link hover:underline">
          Esqueci minha senha
        </Link>
      </p>

      <p className="text-center text-sm text-muted-foreground">
        Ainda não tem conta?{" "}
        <Link
          href={withCallbackUrl("/cadastro", callbackUrl)}
          className="font-medium text-link hover:underline"
        >
          Criar conta
        </Link>
      </p>
    </div>
  );
}
