import Link from "next/link";
import { SiteLayout } from "@/components/shared/site-layout";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

// Fica na raiz, fora dos grupos de rota — por isso monta o próprio SiteLayout (header/rodapé).
export default function NotFound() {
  return (
    <SiteLayout>
      <EmptyState
        image={{ src: "/branding/21_gatinha_de_costas.png", width: 130, height: 200 }}
        title="Essa página fugiu da cozinha"
        description="Não encontramos o que você procurava. O endereço pode ter mudado ou não existir mais."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button nativeButton={false} render={<Link href="/cardapio" />}>
              Ver cardápio
            </Button>
            <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
              Voltar ao início
            </Button>
          </div>
        }
        className="py-20"
      />
    </SiteLayout>
  );
}
