import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function ProdutoNotFound() {
  return (
    <EmptyState
      image={{ src: "/branding/21_gatinha_de_costas.png", width: 130, height: 200 }}
      title="Esse doce não está no cardápio"
      description="Ele pode ter saído do cardápio ou o link está incorreto. Que tal ver o que temos hoje?"
      action={
        <Button nativeButton={false} render={<Link href="/cardapio" />}>
          Ver cardápio
        </Button>
      }
      className="py-20"
    />
  );
}
