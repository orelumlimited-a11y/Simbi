import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardBody, StatCard } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/format";
import { EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from "@/lib/constants";
import { profitMargin } from "@/lib/finance";
import { getCompanyLocale } from "@/lib/company";
import { NewExpenseForm } from "@/components/finance/NewExpenseForm";

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ dateFrom?: string; dateTo?: string; customerId?: string }>;
}) {
  const sp = await searchParams;

  const orderWhere = {
    ...(sp.customerId ? { customerId: sp.customerId } : {}),
    ...(sp.dateFrom || sp.dateTo
      ? {
          createdAt: {
            ...(sp.dateFrom ? { gte: new Date(sp.dateFrom) } : {}),
            ...(sp.dateTo ? { lte: new Date(sp.dateTo + "T23:59:59") } : {}),
          },
        }
      : {}),
  };

  const [orders, expenses, customers, { currency, locale }] = await Promise.all([
    prisma.order.findMany({ where: orderWhere, select: { totalCharged: true, estimatedProfit: true, currentStageKey: true } }),
    prisma.expense.findMany({
      where: sp.dateFrom || sp.dateTo ? { date: orderWhere.createdAt } : undefined,
      include: { order: true },
      orderBy: { date: "desc" },
      take: 50,
    }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    getCompanyLocale(),
  ]);

  const grossRevenue = orders.reduce((s, o) => s + o.totalCharged, 0);
  const totalCosts = expenses.reduce((s, e) => s + e.amount, 0);
  const grossProfit = grossRevenue - totalCosts;
  const deliveredCount = orders.filter((o) => o.currentStageKey === "DELIVERED").length || orders.length || 1;
  const avgProfitPerDelivery = orders.length ? grossProfit / orders.length : 0;
  const margin = profitMargin(grossRevenue, grossProfit);

  const costsByCategory = new Map<string, number>();
  for (const e of expenses) {
    costsByCategory.set(e.category, (costsByCategory.get(e.category) ?? 0) + e.amount);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Finance</h1>
          <p className="text-sm text-slate-500">Revenue, costs, and profitability</p>
        </div>
        <NewExpenseForm />
      </div>

      <Card className="p-4">
        <form method="get" className="flex flex-wrap gap-3">
          <select name="customerId" defaultValue={sp.customerId || ""} className="rounded-lg border border-slate-300 px-2 py-2 text-sm">
            <option value="">All customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input type="date" name="dateFrom" defaultValue={sp.dateFrom} className="rounded-lg border border-slate-300 px-2 py-2 text-sm" />
          <input type="date" name="dateTo" defaultValue={sp.dateTo} className="rounded-lg border border-slate-300 px-2 py-2 text-sm" />
          <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">Apply</button>
        </form>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Gross Revenue" value={formatCurrency(grossRevenue, currency, locale)} accent="green" />
        <StatCard label="Total Costs" value={formatCurrency(totalCosts, currency, locale)} accent="orange" />
        <StatCard label="Gross Profit" value={formatCurrency(grossProfit, currency, locale)} accent={grossProfit >= 0 ? "blue" : "red"} />
        <StatCard label="Profit Margin" value={`${margin}%`} />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Avg Profit / Delivery" value={formatCurrency(avgProfitPerDelivery, currency, locale)} />
        <StatCard label="Orders in Period" value={String(orders.length)} />
        <StatCard label="Delivered" value={String(deliveredCount === orders.length ? orders.filter(o=>o.currentStageKey==="DELIVERED").length : deliveredCount)} />
      </div>

      <Card>
        <CardHeader><CardTitle>Costs by Category</CardTitle></CardHeader>
        <CardBody>
          <div className="space-y-3">
            {Array.from(costsByCategory.entries()).map(([cat, amount]) => (
              <div key={cat} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{EXPENSE_CATEGORY_LABELS[cat as ExpenseCategory] ?? cat}</span>
                <span className="font-medium text-slate-800">{formatCurrency(amount, currency, locale)}</span>
              </div>
            ))}
            {costsByCategory.size === 0 && <p className="text-sm text-slate-400">No expenses recorded for this period.</p>}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Expenses</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-2.5 font-medium">Date</th>
                <th className="px-4 py-2.5 font-medium">Category</th>
                <th className="px-4 py-2.5 font-medium">Order</th>
                <th className="px-4 py-2.5 font-medium">Description</th>
                <th className="px-4 py-2.5 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3 text-slate-500">{formatDate(e.date)}</td>
                  <td className="px-4 py-3 text-slate-700">{EXPENSE_CATEGORY_LABELS[e.category as ExpenseCategory] ?? e.category}</td>
                  <td className="px-4 py-3 text-slate-500">{e.order?.orderNumber ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{e.description ?? "—"}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{formatCurrency(e.amount, currency, locale)}</td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">No expenses yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
