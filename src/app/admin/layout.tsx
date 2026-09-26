import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { adminGetOrderAlerts } from "@/services/order-service";
import { AdminMobileHeader, AdminSidebar } from "@/components/admin/admin-sidebar";
import { OrderAlertsProvider } from "@/components/admin/order-alerts";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // O proxy já barra quem não é da equipe; aqui só precisamos dos dados da sessão.
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = { role: session.user.role, name: session.user.name ?? "Equipe" };
  // Toda a equipe vê pedidos (orders:view), então todos recebem o aviso de pedido novo.
  const orderAlerts = await adminGetOrderAlerts();

  return (
    <OrderAlertsProvider initial={orderAlerts}>
      <div className="min-h-screen bg-background md:flex">
        <AdminSidebar {...user} />
        <div className="min-w-0 flex-1">
          <AdminMobileHeader {...user} />
          <main>{children}</main>
        </div>
      </div>
    </OrderAlertsProvider>
  );
}
