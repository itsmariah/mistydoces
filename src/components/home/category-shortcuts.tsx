import Image from "next/image";
import Link from "next/link";
import { getCategoriesWithProductCount } from "@/lib/catalog";
import { cardapioHref, DEFAULT_CATALOG_SORT } from "@/lib/catalog-sort";

/**
 * Ilustração de cada categoria, pelo slug. Categoria não tem campo de imagem no banco;
 * uma categoria nova criada no admin cai no rostinho da Misty até ganhar uma entrada aqui.
 */
const CATEGORY_ILLUSTRATIONS: Record<string, string> = {
  brigadeiros: "/branding/22_coracao_xadrez_com_laco.png",
  "copos-da-felicidade": "/branding/28_coracao_lilas.png",
  brownies: "/branding/14_pote_de_biscoitos.png",
  morango: "/branding/08_morango.png",
  "sobremesas-individuais": "/branding/07_cupcake.png",
  cookies: "/branding/20_prato_de_cookies.png",
  "kits-e-caixas": "/branding/18_laco_azul.png",
};
const FALLBACK_ILLUSTRATION = "/branding/13_rostinho_da_misty.png";

export async function CategoryShortcuts() {
  const categories = await getCategoriesWithProductCount();
  if (categories.length === 0) return null;

  return (
    <section aria-labelledby="categorias-titulo" className="mx-auto max-w-5xl space-y-6 px-4 pb-16 sm:pb-24">
      <h2 id="categorias-titulo" className="text-center font-heading text-2xl font-semibold">
        O que vai ser hoje?
      </h2>

      {/* No celular, faixa com rolagem lateral; a partir de `sm`, os atalhos quebram linha centralizados. */}
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={cardapioHref({ categoria: category.slug, ordem: DEFAULT_CATALOG_SORT })}
            className="group flex w-32 shrink-0 snap-start flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center transition-[translate,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-secondary-foreground/15"
          >
            <span className="flex size-16 items-center justify-center rounded-full bg-secondary transition-transform duration-300 group-hover:scale-110">
              <Image
                src={CATEGORY_ILLUSTRATIONS[category.slug] ?? FALLBACK_ILLUSTRATION}
                alt=""
                width={44}
                height={44}
                className="h-11 w-11 object-contain"
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
