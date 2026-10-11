import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Fecho da home: convida para o cardápio antes do rodapé. */
export function FinalCta() {
  return (
    <section aria-labelledby="cta-final-titulo" className="mx-auto max-w-5xl px-4 pt-12 pb-16 sm:pt-16 sm:pb-20">
      <div className="reveal relative grid items-center gap-6 overflow-hidden rounded-3xl bg-secondary px-6 py-10 text-center sm:grid-cols-[auto_auto] sm:justify-center sm:gap-10 sm:px-12 sm:text-left dark:bg-script/15">
        {/* Brilho suave atrás da Misty, no mesmo espírito do hero. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -left-16 size-64 rounded-full bg-background/50 blur-3xl dark:bg-script/20"
        />
        <Image
          src="/branding/17_gatinha_chefe_de_pe.png"
          alt=""
          width={136}
          height={150}
          className="relative mx-auto h-auto w-28 sm:w-34 dark:brightness-95"
        />
        <div className="relative flex flex-col items-center gap-3 sm:items-start">
          <p className="font-display text-2xl text-script">a cozinha da Misty está te esperando</p>
          <h2
            id="cta-final-titulo"
            className="text-balance font-heading text-3xl font-semibold text-secondary-foreground"
          >
            Bateu vontade de um docinho?
          </h2>
          <p className="max-w-md text-pretty text-secondary-foreground/80">
            Escolha seus favoritos e receba em casa ou retire com a gente.
          </p>
          <Button size="lg" nativeButton={false} render={<Link href="/cardapio" />} className="mt-2">
            Ver cardápio
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  );
}
