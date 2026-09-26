import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Esqueleto de uma página de lista do painel (título, filtros opcionais e linhas). */
export function AdminListSkeleton({
  width = "max-w-2xl",
  rows = 5,
  withFilters = false,
}: {
  width?: "max-w-2xl" | "max-w-3xl";
  rows?: number;
  withFilters?: boolean;
}) {
  return (
    <div className={cn("mx-auto space-y-6 px-4 py-12", width)} aria-busy="true">
      <span className="sr-only">Carregando…</span>
      <Skeleton className="h-8 w-40" />
      {withFilters && (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-7 w-20 rounded-full" />
          ))}
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border border-border p-4"
          >
            <div className="space-y-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Esqueleto de uma página de formulário ou de detalhe do painel. */
export function AdminFormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="px-4 py-12" aria-busy="true">
      <span className="sr-only">Carregando…</span>
      <div className="max-w-2xl space-y-6">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: fields }, (_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
        <Skeleton className="h-9 w-32" />
      </div>
    </div>
  );
}
