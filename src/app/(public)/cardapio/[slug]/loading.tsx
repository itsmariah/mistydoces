import { Skeleton } from "@/components/ui/skeleton";

export default function ProdutoLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-12" aria-busy="true">
      <span className="sr-only">Carregando o produto…</span>
      <Skeleton className="h-5 w-36" />

      <div className="grid gap-8 sm:grid-cols-2">
        <Skeleton className="aspect-square w-full rounded-2xl" />

        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-3/4" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-9 w-full sm:w-64" />
        </div>
      </div>
    </div>
  );
}
