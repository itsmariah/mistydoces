import Image from "next/image";
import type { ReactNode } from "react";
import { Logo } from "@/components/shared/logo";
import { FloatingSticker, type Sticker } from "@/components/shared/floating-sticker";

const STICKERS: Sticker[] = [
  {
    src: "/branding/26_moranguinho.png",
    width: 160,
    height: 165,
    className: "left-[12%] top-[14%] w-14",
    rotate: "-10deg",
    delay: "0s",
  },
  {
    src: "/branding/18_laco_azul.png",
    width: 156,
    height: 174,
    className: "right-[14%] top-[20%] w-14",
    rotate: "12deg",
    delay: "-2s",
  },
  {
    src: "/branding/20_prato_de_cookies.png",
    width: 245,
    height: 245,
    className: "left-[16%] bottom-[16%] w-16",
    rotate: "6deg",
    delay: "-4s",
  },
  {
    src: "/branding/11_florsinha_azul_2.png",
    width: 155,
    height: 126,
    className: "right-[12%] bottom-[22%] w-12",
    rotate: "-8deg",
    delay: "-3s",
  },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Painel da marca: só no desktop, onde sobra espaço. No celular o formulário vem direto. */}
      <aside
        aria-hidden="true"
        className="relative hidden flex-col items-center justify-center gap-6 overflow-hidden bg-secondary p-12 text-center lg:flex"
      >
        {STICKERS.map((sticker) => (
          <FloatingSticker key={sticker.src} {...sticker} />
        ))}
        <Image
          src="/branding/03_gatinha_chefe_com_flor.png"
          alt=""
          width={266}
          height={391}
          className="h-auto w-48 xl:w-56"
        />
        <p className="font-display text-4xl text-secondary-foreground">pequenos doces momentos</p>
        <p className="max-w-xs text-sm text-secondary-foreground/80">
          Acompanhe seus pedidos, salve seus endereços e peça seus doces favoritos em poucos cliques.
        </p>
      </aside>

      <div className="flex flex-col items-center justify-center gap-8 bg-muted/30 px-4 py-16">
        <Logo size="lg" />
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
