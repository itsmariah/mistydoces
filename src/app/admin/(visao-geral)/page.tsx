import { connection } from "next/server";
import { CalendarRange, Receipt, Sun } from "lucide-react";
import { can } from "@/lib/permissions";
import { requirePagePermission } from "@/lib/require-permission";
import { toMonthKey } from "@/lib/finance";
import { cn, pluralize } from "@/lib/utils";
import {
  DASHBOARD_WINDOW_DAYS,
  getDashboardData,
  percentChange,
} from "@/services/dashboard-service";
import { getAgenda } from "@/services/agenda-service";
import { getFinanceMonth } from "@/services/finance-service";
import { DashboardGreeting } from "@/components/admin/dashboard/greeting";
import { StatTile } from "@/components/admin/dashboard/stat-tile";
import { CountUp } from "@/components/admin/count-up";
import { FinanceTile } from "@/components/admin/dashboard/finance-tile";
import { OpenOrders } from "@/components/admin/dashboard/open-orders";
import { SalesChart } from "@/components/admin/dashboard/sales-chart";
import { TopProducts } from "@/components/admin/dashboard/top-products";
import { RecentReviews } from "@/components/admin/dashboard/recent-reviews";
import { TodayAgenda } from "@/components/admin/dashboard/today-agenda";

export default async function AdminDashboardPage() {
  const user = await requirePagePermission("dashboard:view");
  // "Hoje" depende do momento da requisição — nunca pode sair do prerender.
  await connection();
  const now = new Date();
  // O resumo financeiro é só do Proprietário: nem busca para os outros níveis.
  const showFinance = can(user.role, "finance:manage");
  const month = toMonthKey(now);

  const [data, [today], finance] = await Promise.all([
    getDashboardData(now),
    getAgenda(now, 1),
    showFinance ? getFinanceMonth(month) : null,
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:py-12">
      <DashboardGreeting name={user.name ?? "Equipe"} now={now} />

      <div
        className={cn(
          "grid grid-cols-2 gap-3 sm:gap-4",
          finance ? "lg:grid-cols-4" : "lg:grid-cols-3",
        )}
      >
        <StatTile
          icon={Sun}
          label="Hoje"
          value={<CountUp value={data.today.revenue} format="currency" />}
          detail={pluralize(data.today.orders, "pedido", "pedidos")}
          trend={{
            percent: percentChange(data.today.revenue, data.yesterdaySoFar.revenue),
            label: "vs. ontem neste horário",
          }}
        />
        <StatTile
          icon={CalendarRange}
          label={`Últimos ${DASHBOARD_WINDOW_DAYS} dias`}
          value={<CountUp value={data.period.revenue} format="currency" />}
          detail={pluralize(data.period.orders, "pedido", "pedidos")}
          trend={{
            percent: percentChange(data.period.revenue, data.previousPeriod.revenue),
            label: `vs. ${DASHBOARD_WINDOW_DAYS} dias anteriores`,
          }}
        />
        <StatTile
          icon={Receipt}
          label="Ticket médio"
          value={<CountUp value={data.period.averageTicket} format="currency" />}
          detail={`Últimos ${DASHBOARD_WINDOW_DAYS} dias`}
          trend={{
            percent: percentChange(data.period.averageTicket, data.previousPeriod.averageTicket),
            label: `vs. ${DASHBOARD_WINDOW_DAYS} dias anteriores`,
          }}
        />
        {finance && <FinanceTile summary={finance.summary} month={month} />}
      </div>

      <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
        {/* Primeiro no HTML: no celular, o que pede ação vem logo depois dos números. */}
        <aside className="space-y-4 lg:order-last" aria-label="Hoje na loja">
          <OpenOrders counts={data.openOrders} />
          <TodayAgenda day={today} now={now} />
        </aside>

        <div className="min-w-0 space-y-4 lg:col-span-2">
          <SalesChart days={data.dailySales} />
          <div className="grid gap-4 xl:grid-cols-2">
            <TopProducts products={data.topProducts} windowDays={DASHBOARD_WINDOW_DAYS} />
            <RecentReviews reviews={data.recentReviews} />
          </div>
        </div>
      </div>
    </div>
  );
}
