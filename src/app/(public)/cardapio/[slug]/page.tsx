import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { VariantSelector } from "@/components/catalog/variant-selector";
import { getProductBySlug } from "@/lib/catalog";

export default async function ProdutoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-12">
      <Link
        href="/cardapio"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar ao cardápio
      </Link>

      <div className="grid gap-8 sm:grid-cols-2">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-muted">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(min-width: 640px) 50vw, 100vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-7xl">
              🍰
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <span className="text-sm font-medium text-muted-foreground">
              {product.category.name}
            </span>
            <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
              {product.name}
            </h1>
          </div>

          {!product.isAvailable && (
            <Badge variant="secondary" className="w-fit">
              Esgotado no momento
            </Badge>
          )}

          <p className="text-muted-foreground">{product.description}</p>

          <VariantSelector
            variants={product.variants.map((variant) => ({
              id: variant.id,
              label: variant.label,
              price: Number(variant.price),
            }))}
            disabled={!product.isAvailable}
          />
        </div>
      </div>
    </div>
  );
}
