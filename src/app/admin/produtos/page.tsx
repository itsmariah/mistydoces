import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { can } from "@/lib/permissions";
import { requirePagePermission } from "@/lib/require-permission";
import { listProductsAdmin } from "@/services/product-service";
import { listCategoriesAdmin } from "@/services/category-service";
import { filterProductsBySearch } from "@/lib/catalog-search";
import { ProductAvailabilityToggle } from "@/components/admin/product-availability-toggle";
import { ProductPlaceholderImage } from "@/components/catalog/product-placeholder-image";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency, getStartingPrice, pluralize } from "@/lib/utils";

type Product = Awaited<ReturnType<typeof listProductsAdmin>>[number];

const STATUS_FILTERS = {
  disponiveis: {
    label: "Disponíveis",
    match: (p: Product) => p.isActive && p.isAvailable,
  },
  esgotados: { label: "Esgotados", match: (p: Product) => !p.isAvailable },
  inativos: { label: "Inativos", match: (p: Product) => !p.isActive },
} as const;
type StatusFilter = keyof typeof STATUS_FILTERS;

type ProductsQuery = { busca?: string; categoria?: string; status?: StatusFilter };

function productsHref({ busca, categoria, status }: ProductsQuery) {
  const params = new URLSearchParams();
  if (busca) params.set("busca", busca);
  if (categoria) params.set("categoria", categoria);
  if (status) params.set("status", status);
  const query = params.toString();
  return query ? `/admin/produtos?${query}` : "/admin/produtos";
}

const chipClass = (active: boolean) =>
  cn(
    "flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm",
    active ? "border-link bg-primary/10 text-link" : "border-border hover:bg-muted",
  );

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; categoria?: string; status?: string }>;
}) {
  const user = await requirePagePermission("products:view");
  const canEdit = can(user.role, "products:edit");
  const canToggle = can(user.role, "products:toggle_availability");

  const params = await searchParams;
  const busca = params.busca?.trim() || undefined;
  // hasOwn, não `in`: `?status=toString` não pode passar por um filtro válido.
  const status =
    params.status && Object.hasOwn(STATUS_FILTERS, params.status)
      ? (params.status as StatusFilter)
      : undefined;

  const [allProducts, categories] = await Promise.all([listProductsAdmin(), listCategoriesAdmin()]);
  const categoria = categories.some((c) => c.id === params.categoria) ? params.categoria : undefined;

  // O catálogo é pequeno: filtra em memória, ignorando acentos (ver catalog-search).
  const searched = filterProductsBySearch(allProducts, busca).filter(
    (p) => !categoria || p.categoryId === categoria,
  );
  const products = status ? searched.filter(STATUS_FILTERS[status].match) : searched;
  const hasFilters = Boolean(busca || categoria || status);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Produtos</h1>
        {canEdit && allProducts.length > 0 && (
          <Button nativeButton={false} render={<Link href="/admin/produtos/novo" />}>
            Novo produto
          </Button>
        )}
      </div>

      {allProducts.length === 0 ? (
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
      ) : (
        <>
          <form action="/admin/produtos" className="flex flex-wrap gap-2" role="search">
            {status && <input type="hidden" name="status" value={status} />}
            <Input
              name="busca"
              type="search"
              defaultValue={busca}
              placeholder="Buscar produto"
              aria-label="Buscar produtos"
              className="min-w-48 flex-1"
            />
            <select
              name="categoria"
              defaultValue={categoria ?? ""}
              aria-label="Filtrar por categoria"
              className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
            >
              <option value="">Todas as categorias</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <Button type="submit" variant="outline">
              <Search /> Filtrar
            </Button>
          </form>

          <div className="flex flex-wrap gap-2">
            <Link href={productsHref({ busca, categoria })} className={chipClass(!status)}>
              Todos <span className="text-xs text-muted-foreground">{searched.length}</span>
            </Link>
            {(Object.keys(STATUS_FILTERS) as StatusFilter[]).map((key) => (
              <Link
                key={key}
                href={productsHref({ busca, categoria, status: key })}
                className={chipClass(status === key)}
              >
                {STATUS_FILTERS[key].label}
                <span className="text-xs text-muted-foreground">
                  {searched.filter(STATUS_FILTERS[key].match).length}
                </span>
              </Link>
            ))}
          </div>

          {hasFilters && (
            <p className="text-sm text-muted-foreground">
              {pluralize(products.length, "produto", "produtos")} ·{" "}
              <Link href="/admin/produtos" className="text-link hover:underline">
                Limpar filtros
              </Link>
            </p>
          )}

          {products.length === 0 ? (
            <EmptyState
              image={{ src: "/branding/07_cupcake.png", width: 90, height: 120 }}
              title="Nenhum produto aqui"
              description="Nenhum produto combina com esses filtros."
            />
          ) : (
            <ul className="space-y-3">
              {products.map((product) => (
                <li
                  key={product.id}
                  className="flex items-center gap-3 rounded-lg surface p-3 transition-colors hover:bg-muted/50"
                >
                  <Link
                    href={`/admin/produtos/${product.id}`}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <ProductPlaceholderImage className="p-1.5" />
                      )}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-medium">{product.name}</span>
                        {!product.isActive && <Badge variant="outline">Inativo</Badge>}
                        {!product.isAvailable && <Badge variant="secondary">Esgotado</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {product.category.name} ·{" "}
                        <span className="font-medium text-link">
                          {formatCurrency(getStartingPrice(product.variants))}
                        </span>
                      </p>
                    </div>
                  </Link>
                  {canToggle && (
                    <ProductAvailabilityToggle
                      productId={product.id}
                      productName={product.name}
                      isAvailable={product.isAvailable}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
