import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { ProductPlaceholderImage } from "@/components/catalog/product-placeholder-image";

type PendingReviewProduct = { id: string; name: string; slug: string; imageUrl: string | null };

/**
 * Lembrete na conta com os doces já recebidos e ainda sem avaliação. Cada item leva
 * direto ao formulário na página do produto (`#avaliacoes`).
 */
export function PendingReviews({
  products,
  total,
}: {
  products: PendingReviewProduct[];
  total: number;
}) {
  if (products.length === 0) return null;
  const remaining = total - products.length;

  return (
    <section
      aria-labelledby="avaliar-titulo"
      className="space-y-4 rounded-2xl border border-primary/30 bg-primary/5 p-5"
    >
      <div className="flex items-start gap-3">
        <Image
          src="/branding/16_tag_aprovado_pela_chefe.png"
          alt=""
          width={56}
          height={47}
          className="shrink-0"
        />
        <div className="space-y-0.5">
          <h2 id="avaliar-titulo" className="font-heading text-lg font-medium">
            Avalie seus doces
          </h2>
          <p className="text-sm text-muted-foreground">
            Conta pra gente o que achou — sua opinião ajuda outras pessoas a escolher.
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {products.map((product) => (
          <li key={product.id}>
            <Link
              href={`/cardapio/${product.slug}#avaliacoes`}
              className="group flex items-center gap-3 rounded-xl bg-card p-2 pr-3 transition-colors hover:bg-muted"
            >
              <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                {product.imageUrl ? (
                  <Image src={product.imageUrl} alt="" fill sizes="48px" className="object-cover" />
                ) : (
                  <ProductPlaceholderImage className="object-contain p-1" />
                )}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{product.name}</span>
              <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-link group-hover:underline">
                <Star className="size-4" aria-hidden="true" />
                Avaliar
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {remaining > 0 && (
        <p className="text-xs text-muted-foreground">
          E mais {remaining} {remaining === 1 ? "doce" : "doces"} esperando sua avaliação.
        </p>
      )}
    </section>
  );
}
