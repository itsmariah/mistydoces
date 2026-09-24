import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FeaturedProducts } from "@/components/home/featured-products";
import { CategoryShortcuts } from "@/components/home/category-shortcuts";
import { HowItWorks } from "@/components/home/how-it-works";
import { Testimonials } from "@/components/home/testimonials";

export default function HomePage() {
  return (
    <>
      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-16 text-center sm:py-24">
        <Image
          src="/branding/01_logo_misty_doces.png"
          alt="MistyDoces — doces feitos com muito amor"
          width={210}
          height={235}
          priority
        />
        <span className="rounded-full bg-accent px-4 py-1 text-sm font-medium text-accent-foreground">
          🐾 Doces artesanais feitos com carinho
        </span>
        <h1 className="text-balance font-heading text-4xl font-semibold sm:text-5xl">
          Bem-vinda à <span className="text-link">MistyDoces</span>
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
      </section>

      <CategoryShortcuts />
      <FeaturedProducts />
      <HowItWorks />
      <Testimonials />
    </>
  );
}
