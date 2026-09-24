"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getPreviousPathname } from "@/components/shared/navigation-tracker";

/**
 * Se o cliente veio do cardápio, volta pelo histórico: o Next restaura a página do cache
 * de voltar/avançar com a mesma rolagem, categoria, ordem e busca. Vindo de qualquer outro
 * lugar (link do WhatsApp, home, outro produto), é um link normal para o cardápio.
 */
export function BackToCardapioLink() {
  const router = useRouter();

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    // Ctrl/Cmd/Shift/botão do meio: deixa o navegador abrir em nova aba/janela normalmente.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    if (getPreviousPathname() === "/cardapio") {
      event.preventDefault();
      router.back();
    }
  }

  return (
    <Link
      href="/cardapio"
      onClick={handleClick}
      className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft className="h-4 w-4" />
      Voltar ao cardápio
    </Link>
  );
}
