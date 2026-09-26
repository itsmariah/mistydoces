import { ROLE_LABELS, STAFF_ROLES, STAFF_ROLE_DESCRIPTIONS } from "@/lib/permissions";
import { requirePagePermission } from "@/lib/require-permission";
import { listTeam } from "@/services/user-service";
import { TeamList } from "@/components/admin/team-list";
import { TeamMemberForm } from "@/components/admin/team-member-form";

export default async function AdminTeamPage() {
  const user = await requirePagePermission("team:manage");
  const members = await listTeam();

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-12">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Equipe</h1>
        <p className="text-sm text-muted-foreground">
          Quem pode acessar o painel e o que cada pessoa pode fazer.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-medium">Adicionar à equipe</h2>
        <p className="text-sm text-muted-foreground">
          A pessoa precisa já ter uma conta no site; ela continua podendo comprar como cliente.
        </p>
        <TeamMemberForm />
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-medium">Membros</h2>
        <TeamList members={members} currentUserId={user.id} />
      </section>

      <section className="space-y-3 rounded-lg border border-border bg-card p-4">
        <h2 className="font-heading text-lg font-medium">Níveis de acesso</h2>
        <dl className="space-y-2 text-sm">
          {STAFF_ROLES.map((role) => (
            <div key={role}>
              <dt className="font-medium">{ROLE_LABELS[role]}</dt>
              <dd className="text-muted-foreground">{STAFF_ROLE_DESCRIPTIONS[role]}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
