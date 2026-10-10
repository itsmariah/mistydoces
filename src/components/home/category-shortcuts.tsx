import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { getCategoriesWithProductCount } from "@/lib/catalog";
import { categoryIllustration } from "@/lib/category-illustrations";
import { cardapioHref, DEFAULT_CATALOG_SORT } from "@/lib/catalog-sort";

export async function CategoryShortcuts() {
  const categories = await getCategoriesWithProductCount();
  if (categories.length === 0) return null;

  return (
    <section aria-labelledby="categorias-titulo" className="mx-auto max-w-5xl space-y-6 px-4 pb-12 sm:pb-16">
      <div className="reveal text-center">
        <p className="font-display text-xl text-script">escolha por categoria</p>
        <h2 id="categorias-titulo" className="font-heading text-2xl font-semibold">
          O que vai ser hoje?
        </h2>
      </div>

      {/* No celular, faixa com rolagem lateral; a partir de `sm`, os atalhos quebram linha centralizados. */}
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
        {categories.map((category, index) => (
          <Link
            key={category.id}
            href={cardapioHref({ categoria: category.slug, ordem: DEFAULT_CATALOG_SORT })}
            style={{ "--reveal-step": index } as CSSProperties}
            className="reveal group flex w-32 shrink-0 snap-start flex-col items-center gap-2 rounded-2xl surface p-4 text-center transition-[translate,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-secondary-foreground/15"
          >
            <span className="flex size-16 items-center justify-center rounded-full bg-secondary transition-transform duration-300 group-hover:scale-110 dark:bg-script/15">
              <Image
                src={categoryIllustration(category.slug)}
                alt=""
                width={44}
                height={44}
                className="h-11 w-11 object-contain dark:brightness-95"
              />
            </span>
            <span className="text-sm leading-tight font-medium">{category.name}</span>
            <span className="text-xs text-muted-foreground">
              {category._count.products} {category._count.products === 1 ? "doce" : "doces"}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
