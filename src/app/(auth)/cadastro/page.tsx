import Link from "next/link";
import { RegisterForm } from "@/components/account/register-form";
import { isCheckoutCallback, withCallbackUrl } from "@/lib/callback-url";

export default async function RegisterPage({
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
        <h1 className="font-heading text-xl font-semibold">Criar conta</h1>
        <p className="text-sm text-muted-foreground">
          {fromCheckout
            ? "Seu carrinho fica guardado: assim que criar a conta, você volta direto para o pedido."
            : "Cadastre-se para fazer pedidos e acompanhar o status em tempo real."}
        </p>
      </div>

      <RegisterForm callbackUrl={callbackUrl} />

      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link
          href={withCallbackUrl("/login", callbackUrl)}
          className="font-medium text-link hover:underline"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}
