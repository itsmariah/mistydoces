import { ProductCard } from "@/components/catalog/product-card";
import { SectionHeader } from "@/components/shared/section-header";
import { getLatestProducts, getProductsByIds } from "@/lib/catalog";
import { BEST_SELLER_LIMIT, getBestSellerProductIds } from "@/services/best-seller-service";
import { getRatingSummaries } from "@/services/review-service";

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
  const ratings = await getRatingSummaries(products.map((product) => product.id));

  return (
    <section aria-labelledby="destaques-titulo" className="mx-auto max-w-5xl space-y-6 px-4 pb-16 sm:pb-24">
      <SectionHeader
        id="destaques-titulo"
        className="reveal"
        image={{ src: "/branding/10_coracao_patinha.png", width: 40, height: 40 }}
        kicker={hasBestSellers ? "aprovados pela chef" : "saindo do forno"}
        title={hasBestSellers ? "Os favoritos da Misty" : "Novidades da cozinha"}
        description={
          hasBestSellers
            ? "Os doces que mais saíram nas últimas semanas."
            : "Acabaram de chegar ao cardápio."
        }
        link={{ href: "/cardapio", label: "Ver cardápio completo" }}
      />

      {/* No celular vira uma faixa com rolagem lateral; a partir de `sm`, grade de 3.
          O padding vertical evita cortar a animação de entrada e o hover dos cards. */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pt-2 pb-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
        {products.map((product, index) => (
          <div key={product.id} className="w-[70%] shrink-0 snap-start sm:w-auto">
            <ProductCard
              product={product}
              index={index}
              isBestSeller={hasBestSellers}
              rating={ratings.get(product.id)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
