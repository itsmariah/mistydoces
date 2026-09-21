import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-24 text-center">
      <span className="rounded-full bg-accent px-4 py-1 text-sm font-medium text-accent-foreground">
        🐾 Doces artesanais feitos com carinho
      </span>
      <h1 className="text-balance font-heading text-4xl font-semibold sm:text-5xl">
        Bem-vinda à <span className="text-primary">MistyDoces</span>
      </h1>
      <p className="max-w-xl text-balance text-muted-foreground">
        Bolos, brigadeiros, cookies e muito mais — feitos sob encomenda,
        prontos para adoçar o seu dia. O cardápio completo chega em breve por
        aqui.
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
  );
}
