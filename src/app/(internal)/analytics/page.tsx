import {
  getSalesAnalytics,
  getCustomerAnalytics,
  getProfitabilityAnalytics,
  getDeliveryPerformance,
  getOrdersPerDay,
  getStatusBreakdown,
} from "@/lib/queries";
import { Card, CardHeader, CardTitle, CardBody, StatCard } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/format";
import { getCompanyLocale } from "@/lib/company";
import { OrdersTrendChart } from "@/components/charts/OrdersTrendChart";
import { StatusPieChart } from "@/components/charts/StatusPieChart";
import Link from "next/link";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const sp = await searchParams;
  const days = Math.min(90, Math.max(7, parseInt(sp.days || "30", 10) || 30));

  const [sales, customers, profitability, performance, ordersPerDay, statusBreakdown, { currency, locale }] = await Promise.all([
    getSalesAnalytics(days),
    getCustomerAnalytics(days),
    getProfitabilityAnalytics(),
    getDeliveryPerformance(),
    getOrdersPerDay(days),
    getStatusBreakdown(),
    getCompanyLocale(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Analytics</h1>
          <p className="text-sm text-slate-500">Business performance over the last {days} days</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <Link
              key={d}
              href={`/analytics?days=${d}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${days === d ? "bg-brand text-white" : "bg-white text-slate-600 ring-1 ring-slate-300"}`}
            >
              {d}d
            </Link>
          ))}
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Sales Analytics</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Orders in Period" value={String(sales.ordersInPeriod)} />
          <StatCard label="Orders / Day (avg)" value={sales.ordersPerDay.toFixed(1)} />
          <StatCard label="Revenue Growth" value={`${sales.revenueGrowthPct >= 0 ? "+" : ""}${sales.revenueGrowthPct}%`} accent={sales.revenueGrowthPct >= 0 ? "green" : "red"} />
          <StatCard label="Avg Order Value" value={formatCurrency(sales.avgOrderValue, currency, locale)} />
        </div>
        <Card>
          <CardHeader><CardTitle>Orders Over Time</CardTitle></CardHeader>
          <CardBody><OrdersTrendChart data={ordersPerDay} /></CardBody>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Delivery Analytics</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Avg Delivery Time" value={`${performance.avgDeliveryHours.toFixed(1)}h`} />
          <StatCard label="On-Time Delivery" value={`${performance.onTimePct}%`} accent="green" />
          <StatCard label="Failed Delivery Rate" value={`${performance.failedPct}%`} accent="red" />
          <StatCard label="Delivered (Total)" value={String(performance.deliveredCount)} />
        </div>
        <Card>
          <CardHeader><CardTitle>Current Status Distribution</CardTitle></CardHeader>
          <CardBody><StatusPieChart data={statusBreakdown} /></CardBody>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Customer Analytics</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="New Customers" value={String(customers.newCustomers)} />
          <StatCard label="Repeat Customers" value={String(customers.repeatCustomers)} />
          <StatCard label="Total Customers" value={String(customers.totalCustomers)} />
          <StatCard label="Avg Customer Lifetime Value" value={formatCurrency(customers.clv, currency, locale)} />
        </div>
        <Card>
          <CardHeader><CardTitle>Top Customers by Spend</CardTitle></CardHeader>
          <CardBody className="space-y-2">
            {customers.topCustomers.map((c, i) => (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{i + 1}. {c.name} <span className="text-xs text-slate-400">({c.orders} orders)</span></span>
                <span className="font-medium text-slate-800">{formatCurrency(c.totalSpent, currency, locale)}</span>
              </div>
            ))}
            {customers.topCustomers.length === 0 && <p className="text-sm text-slate-400">No customer data yet.</p>}
          </CardBody>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Profitability Analytics</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Avg Profit / Order" value={formatCurrency(profitability.avgProfitPerOrder, currency, locale)} />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader><CardTitle>Most Profitable Customers</CardTitle></CardHeader>
            <CardBody className="space-y-2">
              {profitability.topCustomers.map((c, i) => (
                <div key={c.name + i} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{c.name}</span>
                  <span className="font-medium text-emerald-600">{formatCurrency(c.profit, currency, locale)}</span>
                </div>
              ))}
            </CardBody>
          </Card>
          <Card>
            <CardHeader><CardTitle>Most Profitable Routes</CardTitle></CardHeader>
            <CardBody className="space-y-2">
              {profitability.topRoutes.map((r, i) => (
                <div key={r.route + i} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{r.route}</span>
                  <span className="font-medium text-emerald-600">{formatCurrency(r.profit, currency, locale)}</span>
                </div>
              ))}
            </CardBody>
          </Card>
          <Card>
            <CardHeader><CardTitle>Most Profitable Services</CardTitle></CardHeader>
            <CardBody className="space-y-2">
              {profitability.topServices.map((s, i) => (
                <div key={s.name + i} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{s.name} <span className="text-xs text-slate-400">({s.orders})</span></span>
                  <span className="font-medium text-emerald-600">{formatCurrency(s.profit, currency, locale)}</span>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </section>
    </div>
  );
}
