import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Contato",
};

// Placeholder até termos WhatsApp e e-mail próprios da loja definidos.
export default function ContatoPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-16 text-center">
      <Image src="/branding/14_pote_de_biscoitos.png" alt="" width={160} height={168} />

      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-semibold">Contato</h1>
        <p className="text-muted-foreground">
          Estamos organizando nossos canais de atendimento — em breve você vai poder falar com a
          gente por WhatsApp e e-mail direto por aqui.
        </p>
      </div>

      <Button size="lg" nativeButton={false} render={<Link href="/cardapio" />}>
        Ver cardápio enquanto isso
      </Button>
    </div>
  );
}
