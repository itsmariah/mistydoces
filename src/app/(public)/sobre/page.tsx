import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Nossa história",
};

// O texto é da dona da loja: aqui só muda a diagramação (blocos, destaques), nunca as palavras.
export default function SobrePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-14 px-4 py-16">
      <header className="flex flex-col items-center gap-4 text-center">
        <Image src="/branding/30_faixa_misty_doces.png" alt="" width={200} height={91} />
        <h1 className="font-heading text-3xl font-semibold sm:text-4xl">Nossa história</h1>
        <div className="max-w-xl space-y-3 text-lg leading-relaxed text-muted-foreground">
          <p>Olá, seja bem-vindo à MistyDoces! 💜</p>
          <p>
            Se você chegou até aqui, provavelmente ficou curioso para saber um pouquinho mais
            sobre a nossa história. E, bem... será um grande prazer contá-la!
          </p>
        </div>
      </header>

      <section
        aria-labelledby="sobre-misty"
        className="grid items-center gap-8 rounded-3xl bg-secondary/60 p-6 sm:grid-cols-[auto_1fr] sm:p-10 dark:bg-secondary/40"
      >
        <Image
          src="/branding/03_gatinha_chefe_com_flor.png"
          alt="Ilustração da gatinha Misty vestida de confeiteira, segurando uma flor"
          width={170}
          height={250}
          className="mx-auto"
        />
        <div className="space-y-4 leading-relaxed text-muted-foreground">
          <h2 id="sobre-misty" className="font-display text-3xl text-script">
            a gatinha por trás do nome
          </h2>
          <p>
            O nome da nossa loja, assim como o nosso logotipo e os demais elementos que compõem
            a nossa identidade visual, são uma homenagem a uma de nossas gatinhas — mais
            especificamente, à mais velha e mais alucinada por comida. Mas fiquem tranquilos:
            ela só come ração e comidinhas apropriadas para a espécie dela! 😅
          </p>
          <p>
            A Misty Marshmallow (ou Mishas/Ximelou, para os íntimos) foi resgatada nas
            dependências do Centro Universitário UNIPÊ, em João Pessoa, com indícios de
            abandono. :(
          </p>
          <p>
            Ela sempre foi extremamente dócil, a ponto de praticamente se voluntariar para ser
            adotada: no momento do resgate, simplesmente entrou por conta própria na caixa de
            transporte!
          </p>
        </div>
      </section>

      <section
        aria-labelledby="sobre-comeco"
        className="grid items-center gap-8 sm:grid-cols-[1fr_auto]"
      >
        <div className="space-y-4 leading-relaxed text-muted-foreground">
          <h2 id="sobre-comeco" className="font-display text-3xl text-script">
            como tudo começou
          </h2>
          <p>
            Desde então, ela tem trazido muita alegria para a nossa casa e tornado nossos dias
            mais iluminados com sua presença — além, é claro, das inúmeras peripécias que apronta
            junto com seus irmãos, Sushi e Mingau.
          </p>
          <p>
            E é justamente dessa vontade de levar um pouquinho de alegria para os nossos dias que
            também nasceu a MistyDoces.
          </p>
          <p>
            A gente acredita que um docinho pode fazer toda a diferença no nosso dia. No meio da
            correria da rotina, até aqueles dias mais difíceis podem ficar um pouquinho mais
            leves quando nos permitimos uma pausa para comer algo que gostamos.
          </p>
        </div>
        <Image
          src="/branding/21_gatinha_de_costas.png"
          alt="Ilustração da gatinha Misty de costas, com um laço lilás"
          width={130}
          height={200}
          className="mx-auto"
        />
      </section>

      <figure className="relative mx-auto max-w-xl rounded-3xl surface px-6 py-10 text-center">
        <Image
          src="/branding/22_coracao_xadrez_com_laco.png"
          alt=""
          width={56}
          height={55}
          className="absolute -top-7 left-1/2 -translate-x-1/2 -rotate-6"
        />
        <p className="text-muted-foreground">Sabe aquele momento de:</p>
        <blockquote className="mt-2 font-display text-4xl leading-tight text-script sm:text-5xl">
          &quot;Eu mereço. Hoje eu me mimei.&quot; 🍰✨
        </blockquote>
      </figure>

      <div className="mx-auto max-w-2xl space-y-4 leading-relaxed text-muted-foreground">
        <p>
          Foi pensando nisso que unimos a nossa paixão pela culinária com a vontade de
          proporcionar às pessoas esses pequenos momentos de felicidade através de algo simples,
          gostoso e feito com carinho.
        </p>
        <p>
          Cada doce que fazemos carrega um pouquinho dessa ideia: transformar uma pequena pausa
          do dia em um momento especial.
        </p>
        <p>
          Esperamos que você goste dos nossos produtos, volte muitas vezes e, quem sabe, se
          torne um cliente assíduo da MistyDoces.
        </p>
      </div>

      <footer className="flex flex-col items-center gap-5 text-center">
        <div className="space-y-1 rounded-2xl bg-muted/60 px-6 py-4 text-muted-foreground">
          <p>E pode ficar tranquilo...</p>
          <p className="font-medium text-foreground">
            Podemos deixar isso no off. Não vamos contar para o seu personal trainer. 🤫🍫
          </p>
        </div>
        <Image src="/branding/06_tag_feito_com_carinho.png" alt="" width={100} height={100} />
        <Button
          size="lg"
          className="h-11 px-6 text-base has-data-[icon=inline-end]:pr-5"
          nativeButton={false}
          render={<Link href="/cardapio" />}
        >
          Ver cardápio
          <ArrowRight data-icon="inline-end" aria-hidden="true" />
        </Button>
      </footer>
    </div>
  );
}
