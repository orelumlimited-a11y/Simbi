import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Prisma } from "@prisma/client";
import { StageBadge, PaymentBadge } from "@/components/ui/StageBadge";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/format";
import { getCompanyLocale } from "@/lib/company";
import { PRIORITIES, PAYMENT_STATUSES, PRIORITY_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { Plus, Download } from "lucide-react";

const PAGE_SIZE = 20;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const session = await auth();
  const canSeeFinance = session?.user.role === "ADMIN" || session?.user.financeAccess;
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);

  const where: Prisma.OrderWhereInput = {};

  if (sp.status) where.currentStageKey = sp.status;
  if (sp.driverId) where.driverId = sp.driverId;
  if (sp.customerId) where.customerId = sp.customerId;
  if (sp.paymentStatus) where.paymentStatus = sp.paymentStatus;
  if (sp.serviceId) where.serviceId = sp.serviceId;
  if (sp.priority) where.priority = sp.priority;
  if (sp.destination) where.deliveryCity = { contains: sp.destination };
  if (sp.dateFrom || sp.dateTo) {
    where.createdAt = {
      ...(sp.dateFrom ? { gte: new Date(sp.dateFrom) } : {}),
      ...(sp.dateTo ? { lte: new Date(sp.dateTo + "T23:59:59") } : {}),
    };
  }
  if (sp.search) {
    const q = sp.search;
    where.OR = [
      { orderNumber: { contains: q } },
      { recipientName: { contains: q } },
      { recipientPhone: { contains: q } },
      { senderName: { contains: q } },
      { customer: { name: { contains: q } } },
      { customer: { email: { contains: q } } },
      { customer: { phone: { contains: q } } },
      { trackingToken: { token: { contains: q } } },
    ];
  }

  const [orders, total, drivers, services, stages, { currency, locale }] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { customer: true, currentStage: true, driver: true, service: true, trackingToken: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.order.count({ where }),
    prisma.driver.findMany({ where: { status: "ACTIVE" } }),
    prisma.service.findMany(),
    prisma.deliveryStage.findMany({ orderBy: { sortOrder: "asc" } }),
    getCompanyLocale(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function buildQuery(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { ...sp, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    return `/orders?${params.toString()}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Orders</h1>
          <p className="text-sm text-slate-500">{total} order{total !== 1 ? "s" : ""} found</p>
        </div>
        <div className="flex gap-2">
          <LinkButton href={`/api/orders/export?${new URLSearchParams(Object.fromEntries(Object.entries(sp).filter(([, v]) => v))).toString()}`} variant="secondary">
            <Download className="h-4 w-4" /> Export CSV
          </LinkButton>
          <LinkButton href="/orders/new">
            <Plus className="h-4 w-4" /> New Order
          </LinkButton>
        </div>
      </div>

      <Card className="p-4">
        <form className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8" method="get">
          <input
            type="text"
            name="search"
            defaultValue={sp.search}
            placeholder="Search..."
            className="col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none lg:col-span-2"
          />
          <select name="status" defaultValue={sp.status || ""} className="rounded-lg border border-slate-300 px-2 py-2 text-sm">
            <option value="">All statuses</option>
            {stages.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
          <select name="driverId" defaultValue={sp.driverId || ""} className="rounded-lg border border-slate-300 px-2 py-2 text-sm">
            <option value="">All drivers</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <select name="paymentStatus" defaultValue={sp.paymentStatus || ""} className="rounded-lg border border-slate-300 px-2 py-2 text-sm">
            <option value="">All payments</option>
            {PAYMENT_STATUSES.map((p) => (
              <option key={p} value={p}>{PAYMENT_STATUS_LABELS[p]}</option>
            ))}
          </select>
          <select name="serviceId" defaultValue={sp.serviceId || ""} className="rounded-lg border border-slate-300 px-2 py-2 text-sm">
            <option value="">All services</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select name="priority" defaultValue={sp.priority || ""} className="rounded-lg border border-slate-300 px-2 py-2 text-sm">
            <option value="">All priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
            ))}
          </select>
          <input
            type="text"
            name="destination"
            defaultValue={sp.destination}
            placeholder="Destination city"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input type="date" name="dateFrom" defaultValue={sp.dateFrom} className="rounded-lg border border-slate-300 px-2 py-2 text-sm" />
          <input type="date" name="dateTo" defaultValue={sp.dateTo} className="rounded-lg border border-slate-300 px-2 py-2 text-sm" />
          <button type="submit" className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark">
            Apply Filters
          </button>
          <Link href="/orders" className="flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100">
            Clear
          </Link>
        </form>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-2.5 font-medium">Order #</th>
                <th className="px-4 py-2.5 font-medium">Customer</th>
                <th className="px-4 py-2.5 font-medium">Recipient</th>
                <th className="px-4 py-2.5 font-medium">Destination</th>
                <th className="px-4 py-2.5 font-medium">Driver</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Created</th>
                <th className="px-4 py-2.5 font-medium">Est. Delivery</th>
                {canSeeFinance && <th className="px-4 py-2.5 font-medium">Price</th>}
                <th className="px-4 py-2.5 font-medium">Payment</th>
                {canSeeFinance && <th className="px-4 py-2.5 font-medium">Profit</th>}
                <th className="px-4 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/orders/${o.id}`} className="font-medium text-brand hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{o.customer.name}</td>
                  <td className="px-4 py-3 text-slate-700">{o.recipientName}</td>
                  <td className="px-4 py-3 text-slate-500">{o.deliveryCity}, {o.deliveryCountry}</td>
                  <td className="px-4 py-3 text-slate-500">{o.driver?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StageBadge label={o.currentStage.label} color={o.currentStage.color} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(o.createdAt)}</td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(o.estimatedDeliveryDate)}</td>
                  {canSeeFinance && <td className="px-4 py-3 text-slate-700">{formatCurrency(o.customerPrice, currency, locale)}</td>}
                  <td className="px-4 py-3">
                    <PaymentBadge status={o.paymentStatus} />
                  </td>
                  {canSeeFinance && (
                    <td className={`px-4 py-3 font-medium ${o.estimatedProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {formatCurrency(o.estimatedProfit, currency, locale)}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <Link href={`/orders/${o.id}`} className="text-xs font-medium text-brand hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-10 text-center text-sm text-slate-400">
                    No orders match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={buildQuery({ page: String(page - 1) })} className="rounded-lg px-3 py-1.5 ring-1 ring-slate-300 hover:bg-slate-50">
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link href={buildQuery({ page: String(page + 1) })} className="rounded-lg px-3 py-1.5 ring-1 ring-slate-300 hover:bg-slate-50">
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
