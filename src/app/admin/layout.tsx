import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminMobileHeader, AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // O proxy já barra quem não é da equipe; aqui só precisamos dos dados da sessão.
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = { role: session.user.role, name: session.user.name ?? "Equipe" };

  return (
    <div className="min-h-screen bg-background md:flex">
      <AdminSidebar {...user} />
      <div className="min-w-0 flex-1">
        <AdminMobileHeader {...user} />
        <main>{children}</main>
      </div>
    </div>
  );
}
