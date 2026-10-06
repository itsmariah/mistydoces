import Image from "next/image";
import Link from "next/link";
import { Bike, ChefHat, CreditCard, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingSticker, type Sticker } from "@/components/shared/floating-sticker";

// Os dois últimos só aparecem a partir de `sm`: no celular a ilustração é menor e ficaria poluída.
const STICKERS: Sticker[] = [
  {
    src: "/branding/08_morango.png",
    width: 165,
    height: 191,
    className: "left-0 top-4 w-11 sm:w-14",
    rotate: "-12deg",
    delay: "0s",
  },
  {
    src: "/branding/09_florsinha_azul.png",
    width: 131,
    height: 133,
    className: "right-2 top-0 w-9 sm:w-12",
    rotate: "8deg",
    delay: "-1.5s",
  },
  {
    src: "/branding/04_laco_lilas.png",
    width: 211,
    height: 184,
    className: "-left-2 bottom-8 w-12 sm:w-16",
    rotate: "10deg",
    delay: "-3s",
  },
  {
    src: "/branding/07_cupcake.png",
    width: 181,
    height: 240,
    className: "right-0 bottom-2 w-11 sm:w-14",
    rotate: "-6deg",
    delay: "-4.5s",
  },
  {
    src: "/branding/28_coracao_lilas.png",
    width: 131,
    height: 112,
    className: "-right-4 top-1/2 hidden w-9 sm:block",
    rotate: "14deg",
    delay: "-2s",
  },
  {
    src: "/branding/31_florsinha_azul_3.png",
    width: 108,
    height: 143,
    className: "left-6 top-1/2 hidden w-8 sm:block",
    rotate: "-8deg",
    delay: "-5s",
  },
];

const HIGHLIGHTS: { icon: LucideIcon; label: string }[] = [
  { icon: ChefHat, label: "Feito sob encomenda" },
  { icon: CreditCard, label: "Pix ou cartão online" },
  { icon: Bike, label: "Entrega ou retirada" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-linear-to-b from-accent/70 to-transparent dark:from-secondary/60">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 sm:py-16 lg:grid-cols-2 lg:gap-12 lg:py-20">
        <div className="flex flex-col items-center gap-5 text-center lg:items-start lg:text-left">
          <p className="font-display text-2xl text-script sm:text-3xl">um doce para alegrar seu dia</p>
          <h1 className="text-balance font-heading text-4xl font-semibold sm:text-5xl">
            Boas-vindas à <span className="text-link">MistyDoces</span>
          </h1>
          <p className="max-w-xl text-balance text-muted-foreground">
            Bolos, brigadeiros, cookies e muito mais — feitos sob encomenda,
            prontos para adoçar o seu dia.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" nativeButton={false} render={<Link href="/cardapio" />}>
              Ver cardápio
            </Button>
            <Button
              variant="outline"
              size="lg"
              nativeButton={false}
              render={<Link href="/contato" />}
            >
              Falar com a loja
            </Button>
          </div>
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 pt-2 text-sm text-muted-foreground lg:justify-start">
            {HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-1.5">
                <Icon className="size-4 text-link" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        {/* No celular a ilustração vem antes do texto, como uma capa. */}
        <div className="relative order-first mx-auto size-64 sm:size-80 lg:order-last lg:size-104">
          <div
            aria-hidden="true"
            className="absolute inset-6 rounded-full bg-linear-to-br from-primary/50 to-secondary blur-2xl dark:from-script/30 dark:to-primary/20"
          />
          <Image
            src="/branding/01_logo_misty_doces.png"
            alt="MistyDoces — doces feitos com muito amor"
            width={492}
            height={550}
            preload
            sizes="(min-width: 1024px) 18rem, (min-width: 640px) 14rem, 11rem"
            className="absolute top-1/2 left-1/2 h-auto w-44 -translate-x-1/2 -translate-y-1/2 animate-breathe hover:animate-wiggle sm:w-56 lg:w-72 dark:brightness-95"
          />
          {STICKERS.map((sticker) => (
            <FloatingSticker key={sticker.src} {...sticker} />
          ))}
        </div>
      </div>
    </section>
  );
}
