import Link from "next/link";
import type { TopProduct } from "@/services/dashboard-service";
import { formatCurrency } from "@/lib/utils";

export function TopProducts({ products, windowDays }: { products: TopProduct[]; windowDays: number }) {
  return (
    <section className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="space-y-0.5">
        <h2 className="font-heading text-lg font-semibold">Mais vendidos</h2>
        <p className="text-sm text-muted-foreground">Unidades nos últimos {windowDays} dias</p>
      </div>

      {products.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma venda no período.</p>
      ) : (
        <ol className="divide-y divide-border">
          {products.map((product, index) => (
            <li key={product.productId} className="flex items-center gap-3 py-2">
              <span className="w-4 text-sm tabular-nums text-muted-foreground">{index + 1}</span>
              <Link
                href={`/admin/produtos/${product.productId}`}
                className="min-w-0 flex-1 truncate text-sm font-medium hover:underline"
              >
                {product.name}
              </Link>
              <span className="text-sm tabular-nums">
                {product.units} un.
              </span>
              <span className="w-24 text-right text-sm tabular-nums text-muted-foreground">
                {formatCurrency(product.revenue)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
