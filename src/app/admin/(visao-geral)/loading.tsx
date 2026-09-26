import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-12" aria-busy="true">
      <span className="sr-only">Carregando…</span>
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="space-y-3 rounded-lg border border-border p-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-4 w-44" />
          </div>
        ))}
      </div>

      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-72 w-full rounded-lg" />
    </div>
  );
}
