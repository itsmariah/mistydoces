import Link from "next/link";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { can } from "@/lib/permissions";
import { parsePage } from "@/lib/pagination";
import { requirePagePermission } from "@/lib/require-permission";
import { listUsers } from "@/services/user-service";
import { Pagination } from "@/components/admin/pagination";
import { UserList } from "@/components/admin/user-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pluralize } from "@/lib/utils";

function customersHref({ busca, pagina }: { busca?: string; pagina?: number }) {
  const params = new URLSearchParams();
  if (busca) params.set("busca", busca);
  if (pagina && pagina > 1) params.set("pagina", String(pagina));
  const query = params.toString();
  return query ? `/admin/clientes?${query}` : "/admin/clientes";
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; pagina?: string }>;
}) {
  const user = await requirePagePermission("customers:view");
  const params = await searchParams;
  const busca = params.busca?.trim() || undefined;
  const page = parsePage(params.pagina);

  const { users, total, totalPages } = await listUsers({ search: busca, page });

  // Página além do fim (ex.: link antigo depois de buscar) volta para a última que existe.
  if (page > totalPages) redirect(customersHref({ busca, pagina: totalPages }));

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Clientes</h1>
        {can(user.role, "team:manage") && (
          <p className="text-sm text-muted-foreground">
            Para dar acesso ao painel a alguém, use a página{" "}
            <Link href="/admin/equipe" className="text-link underline-offset-4 hover:underline">
              Equipe
            </Link>
            .
          </p>
        )}
      </div>

      <form action="/admin/clientes" className="flex gap-2" role="search">
        <Input
          name="busca"
          type="search"
          defaultValue={busca}
          placeholder="Buscar por nome, e-mail ou telefone"
          aria-label="Buscar clientes"
        />
        <Button type="submit" variant="outline">
          <Search /> Buscar
        </Button>
      </form>

      {busca && (
        <p className="text-sm text-muted-foreground">
          {pluralize(total, "resultado", "resultados")} para &ldquo;{busca}&rdquo; ·{" "}
          <Link href="/admin/clientes" className="text-link hover:underline">
            Limpar busca
          </Link>
        </p>
      )}

      <UserList
        users={users}
        currentUserId={user.id}
        canViewOrders={can(user.role, "orders:view")}
        isSearch={Boolean(busca)}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        hrefFor={(pagina) => customersHref({ busca, pagina })}
      />
    </div>
  );
}
