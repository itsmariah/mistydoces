import type { Metadata } from "next";
import Link from "next/link";
import { ProductGrid } from "@/components/catalog/product-grid";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { getProductsByIds } from "@/lib/catalog";
import { getBestSellerProductIds } from "@/services/best-seller-service";
import { getCurrentFavorites } from "@/services/favorite-service";
import { getRatingSummaries } from "@/services/review-service";

export const metadata: Metadata = { title: "Favoritos" };

export default async function FavoritosPage() {
  const favorites = await getCurrentFavorites();
  // Na ordem salva (mais recente primeiro); o que saiu do cardápio simplesmente não volta.
  const [products, bestSellerIds] = await Promise.all([
    getProductsByIds(favorites.ids),
    getBestSellerProductIds(),
  ]);
  const ratings = await getRatingSummaries(products.map((product) => product.id));

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-12">
      <div className="space-y-2 text-center">
        <p className="font-display text-2xl text-link">os doces que você mais gostou</p>
        <h1 className="font-heading text-3xl font-semibold sm:text-4xl">Favoritos</h1>
        {!favorites.isLoggedIn && products.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Seus favoritos ficam salvos neste navegador.{" "}
            <Link href="/login?callbackUrl=/favoritos" className="text-link hover:underline">
              Entre na sua conta
            </Link>{" "}
            para levá-los para qualquer aparelho.
          </p>
        )}
      </div>

      <h2 className="sr-only">Produtos favoritos</h2>
      <ProductGrid
        products={products}
        bestSellerIds={bestSellerIds}
        ratings={ratings}
        emptyState={
          <EmptyState
            image={{ src: "/branding/10_coracao_patinha.png", width: 110, height: 110 }}
            title="Nenhum favorito ainda"
            description="Toque no coração de um doce para guardá-lo aqui e achar rapidinho depois."
            action={
              <Button nativeButton={false} render={<Link href="/cardapio" />}>
                Ver cardápio
              </Button>
            }
            className="py-16"
          />
        }
      />
    </div>
  );
}
