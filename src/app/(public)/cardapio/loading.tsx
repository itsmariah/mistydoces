import { Skeleton } from "@/components/ui/skeleton";
import { ProductCardSkeleton } from "@/components/catalog/product-card-skeleton";

export default function CardapioLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12" aria-busy="true">
      <span className="sr-only">Carregando o cardápio…</span>
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
