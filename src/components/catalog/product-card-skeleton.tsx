import { Skeleton } from "@/components/ui/skeleton";

/** Mesmo formato do `ProductCard`, para a grade não "pular" quando os produtos chegam. */
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-2 h-6 w-24" />
      </div>
    </div>
  );
}
