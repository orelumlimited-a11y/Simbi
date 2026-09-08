import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getDashboardStats, getOrdersPerDay, getStatusBreakdown } from "@/lib/queries";
import { StatCard, Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { OrdersTrendChart } from "@/components/charts/OrdersTrendChart";
import { StatusPieChart } from "@/components/charts/StatusPieChart";
import { StageBadge } from "@/components/ui/StageBadge";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { getCompanyLocale } from "@/lib/company";
import { LinkButton } from "@/components/ui/Button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  const canSeeFinance = session?.user.role === "ADMIN" || session?.user.financeAccess;

  const [stats, ordersPerDay, statusBreakdown, recentOrders, { currency, locale }] = await Promise.all([
    getDashboardStats(),
    getOrdersPerDay(14),
    getStatusBreakdown(),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { customer: true, currentStage: true },
    }),
    getCompanyLocale(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Welcome back, {session?.user.name}. Here&apos;s what&apos;s happening today.</p>
        </div>
        <LinkButton href="/orders/new">
          <Plus className="h-4 w-4" /> New Order
        </LinkButton>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Orders" value={String(stats.totalOrders)} />
        <StatCard label="Active Deliveries" value={String(stats.activeDeliveries)} accent="blue" />
        <StatCard label="Delivered Today" value={String(stats.deliveredToday)} accent="green" />
        <StatCard label="Delayed Deliveries" value={String(stats.delayedCount)} accent="orange" />
      </div>

      {canSeeFinance && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total Revenue" value={formatCurrency(stats.totalRevenue, currency, locale)} accent="green" />
          <StatCard label="Delivery Costs" value={formatCurrency(stats.deliveryCosts, currency, locale)} accent="orange" />
          <StatCard label="Estimated Profit" value={formatCurrency(stats.estimatedProfit, currency, locale)} accent="blue" />
          <StatCard label="Outstanding Payments" value={formatCurrency(stats.outstandingPayments, currency, locale)} accent="red" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Orders — Last 14 Days</CardTitle>
          </CardHeader>
          <CardBody>
            <OrdersTrendChart data={ordersPerDay} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Delivery Status Breakdown</CardTitle>
          </CardHeader>
          <CardBody>
            <StatusPieChart data={statusBreakdown} />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Link href="/orders" className="text-xs font-medium text-brand hover:underline">
            View all
          </Link>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-2.5 font-medium">Order #</th>
                <th className="px-5 py-2.5 font-medium">Customer</th>
                <th className="px-5 py-2.5 font-medium">Destination</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
                <th className="px-5 py-2.5 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <Link href={`/orders/${o.id}`} className="font-medium text-brand hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-700">{o.customer.name}</td>
                  <td className="px-5 py-3 text-slate-500">{o.deliveryCity}, {o.deliveryCountry}</td>
                  <td className="px-5 py-3">
                    <StageBadge label={o.currentStage.label} color={o.currentStage.color} size="sm" />
                  </td>
                  <td className="px-5 py-3 text-slate-400">{formatDateTime(o.createdAt)}</td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-400">
                    No orders yet. Create your first order to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
