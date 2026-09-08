import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/format";
import { getCompanyLocale } from "@/lib/company";
import { NewCustomerForm } from "@/components/customers/NewCustomerForm";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;

  const [customers, { currency, locale, countryName }] = await Promise.all([
    prisma.customer.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } },
              { phone: { contains: search } },
              { company: { contains: search } },
            ],
          }
        : undefined,
      include: { orders: { select: { totalCharged: true, paymentStatus: true, createdAt: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getCompanyLocale(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500">{customers.length} customer{customers.length !== 1 ? "s" : ""}</p>
        </div>
        <NewCustomerForm defaultCountry={countryName} />
      </div>

      <Card className="p-4">
        <form method="get" className="flex gap-2">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search by name, email, phone, or company..."
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
          <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
            Search
          </button>
        </form>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Company</th>
                <th className="px-4 py-2.5 font-medium">Contact</th>
                <th className="px-4 py-2.5 font-medium">Orders</th>
                <th className="px-4 py-2.5 font-medium">Total Spent</th>
                <th className="px-4 py-2.5 font-medium">Outstanding</th>
                <th className="px-4 py-2.5 font-medium">Customer Since</th>
                <th className="px-4 py-2.5 font-medium">Last Order</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const totalSpent = c.orders.reduce((s, o) => s + o.totalCharged, 0);
                const outstanding = c.orders
                  .filter((o) => o.paymentStatus === "UNPAID" || o.paymentStatus === "PARTIAL")
                  .reduce((s, o) => s + o.totalCharged, 0);
                const lastOrder = c.orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
                return (
                  <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/customers/${c.id}`} className="font-medium text-brand hover:underline">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{c.company || "—"}</td>
                    <td className="px-4 py-3 text-slate-500">
                      <div>{c.email}</div>
                      <div className="text-xs text-slate-400">{c.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{c.orders.length}</td>
                    <td className="px-4 py-3 text-slate-700">{formatCurrency(totalSpent, currency, locale)}</td>
                    <td className={`px-4 py-3 font-medium ${outstanding > 0 ? "text-red-600" : "text-slate-400"}`}>
                      {formatCurrency(outstanding, currency, locale)}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-3 text-slate-400">{lastOrder ? formatDate(lastOrder.createdAt) : "—"}</td>
                  </tr>
                );
              })}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">
                    No customers found.
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
