import Link from "next/link";
import { can } from "@/lib/permissions";
import { requirePagePermission } from "@/lib/require-permission";
import { listProductsAdmin } from "@/services/product-service";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, getStartingPrice } from "@/lib/utils";

export default async function AdminProductsPage() {
  const user = await requirePagePermission("products:view");
  const canEdit = can(user.role, "products:edit");
  const products = await listProductsAdmin();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Produtos</h1>
        {canEdit && products.length > 0 && (
          <Button nativeButton={false} render={<Link href="/admin/produtos/novo" />}>
            Novo produto
          </Button>
        )}
      </div>

      {products.length === 0 && (
        <EmptyState
          image={{ src: "/branding/07_cupcake.png", width: 90, height: 120 }}
          title="Nenhum produto ainda"
          description="Cadastre os doces da Misty para eles aparecerem no cardápio."
          action={
            canEdit && (
              <Button nativeButton={false} render={<Link href="/admin/produtos/novo" />}>
                Novo produto
              </Button>
            )
          }
        />
      )}

      <div className="space-y-3">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/admin/produtos/${product.id}`}
            className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{product.name}</span>
                {!product.isActive && <Badge variant="outline">Inativo</Badge>}
                {!product.isAvailable && <Badge variant="secondary">Esgotado</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{product.category.name}</p>
            </div>
            <span className="text-sm font-semibold text-link">
              {formatCurrency(getStartingPrice(product.variants))}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
