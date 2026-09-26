import { connection } from "next/server";
import { requirePagePermission } from "@/lib/require-permission";
import {
  DASHBOARD_WINDOW_DAYS,
  STORE_TIME_ZONE,
  getDashboardData,
} from "@/services/dashboard-service";
import { SalesSummaryCard } from "@/components/admin/dashboard/sales-summary-card";
import { OpenOrders } from "@/components/admin/dashboard/open-orders";
import { SalesChart } from "@/components/admin/dashboard/sales-chart";
import { TopProducts } from "@/components/admin/dashboard/top-products";
import { RecentReviews } from "@/components/admin/dashboard/recent-reviews";

const todayFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: STORE_TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
});

export default async function AdminDashboardPage() {
  await requirePagePermission("dashboard:view");
  // "Hoje" depende do momento da requisição — nunca pode sair do prerender.
  await connection();
  const now = new Date();
  const data = await getDashboardData(now);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-12">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Visão geral</h1>
        <p className="text-sm text-muted-foreground first-letter:uppercase">
          {todayFormatter.format(now)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SalesSummaryCard title="Hoje" summary={data.today} />
        <SalesSummaryCard title={`Últimos ${DASHBOARD_WINDOW_DAYS} dias`} summary={data.period} />
      </div>

      <OpenOrders counts={data.openOrders} />

      <section className="space-y-3 rounded-lg border border-border bg-card p-4">
        <div className="space-y-0.5">
          <h2 className="font-heading text-lg font-semibold">Faturamento por dia</h2>
          <p className="text-sm text-muted-foreground">
            Últimos {DASHBOARD_WINDOW_DAYS} dias, sem pedidos pendentes ou cancelados
          </p>
        </div>
        <SalesChart days={data.dailySales} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <TopProducts products={data.topProducts} windowDays={DASHBOARD_WINDOW_DAYS} />
        <RecentReviews reviews={data.recentReviews} />
      </div>
    </div>
  );
}
