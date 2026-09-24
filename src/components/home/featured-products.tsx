import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/catalog/product-card";
import { getLatestProducts, getProductsByIds } from "@/lib/catalog";
import { BEST_SELLER_LIMIT, getBestSellerProductIds } from "@/services/best-seller-service";

/**
 * Vitrine da home: os mais vendidos quando já há vendas suficientes; enquanto a
 * loja é nova (ranking vazio), mostra os produtos mais recentes no lugar.
 */
export async function FeaturedProducts() {
  const bestSellerIds = await getBestSellerProductIds();
  const hasBestSellers = bestSellerIds.size > 0;
  const products = hasBestSellers
    ? await getProductsByIds([...bestSellerIds])
    : await getLatestProducts(BEST_SELLER_LIMIT);

  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-5xl space-y-6 px-4 pb-16 sm:pb-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <Image src="/branding/10_coracao_patinha.png" alt="" width={40} height={40} />
          <div>
            <h2 className="font-heading text-2xl font-semibold">
              {hasBestSellers ? "Os favoritos da Misty" : "Novidades da cozinha"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {hasBestSellers
                ? "Os doces que mais saíram nas últimas semanas."
                : "Acabaram de chegar ao cardápio."}
            </p>
          </div>
        </div>
        <Link
          href="/cardapio"
          className="inline-flex items-center gap-1 text-sm font-medium text-link hover:underline"
        >
          Ver cardápio completo
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* No celular vira uma faixa com rolagem lateral; a partir de `sm`, grade de 3.
          O padding vertical evita cortar a animação de entrada e o hover dos cards. */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pt-2 pb-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
        {products.map((product, index) => (
          <div key={product.id} className="w-[70%] shrink-0 snap-start sm:w-auto">
            <ProductCard product={product} index={index} isBestSeller={hasBestSellers} />
          </div>
        ))}
      </div>
    </section>
  );
}
