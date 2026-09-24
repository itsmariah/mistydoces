"use client";

import { useEffect } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

type ErrorStateProps = {
  error: Error & { digest?: string };
  retry: () => void;
  homeHref?: string;
};

/** Conteúdo compartilhado dos `error.tsx` — erro inesperado, com opção de tentar de novo. */
export function ErrorState({ error, retry, homeHref = "/" }: ErrorStateProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      image={{ src: "/branding/23_gatinha_chef_rostinho.png", width: 110, height: 158 }}
      title="Ops, algo deu errado"
      description={
        <>
          Tivemos um probleminha na cozinha ao carregar esta página. Tente de novo em
          instantes.
          {error.digest && (
            <span className="mt-2 block text-xs">Código do erro: {error.digest}</span>
          )}
        </>
      }
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => retry()}>Tentar de novo</Button>
          <Button variant="outline" nativeButton={false} render={<Link href={homeHref} />}>
            Voltar ao início
          </Button>
        </div>
      }
      className="py-20"
    />
  );
}
