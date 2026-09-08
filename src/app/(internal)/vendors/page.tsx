import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Card, StatCard } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/format";
import { getCompanyLocale } from "@/lib/company";
import { NewVendorForm } from "@/components/vendors/NewVendorForm";
import { toggleVendorActive } from "@/lib/actions/vendors";
import { Boxes } from "lucide-react";
import clsx from "clsx";

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const session = await auth();
  const canSeeFinance = session?.user.role === "ADMIN" || session?.user.financeAccess;

  const [vendors, { currency, locale, countryName }, productCount, lowStockCount] = await Promise.all([
    prisma.vendor.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } },
              { phone: { contains: search } },
              { contactName: { contains: search } },
            ],
          }
        : undefined,
      include: { stockReceipts: { select: { totalCost: true, quantity: true, receivedAt: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getCompanyLocale(),
    prisma.product.count({ where: { active: true } }),
    prisma.product.findMany({ where: { active: true }, select: { currentStock: true, reorderLevel: true } }).then(
      (products) => products.filter((p) => p.currentStock <= p.reorderLevel).length
    ),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Vendor Management</h1>
        </div>
        <div className="flex gap-2">
          <Link
            href="/vendors/products"
            className="flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
          >
            <Boxes className="h-4 w-4" /> Products & Stock
          </Link>
          <NewVendorForm defaultCountry={countryName} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Vendors" value={String(vendors.length)} />
        <StatCard label="Active Products" value={String(productCount)} />
        <StatCard label="Low Stock Items" value={String(lowStockCount)} accent={lowStockCount > 0 ? "orange" : "default"} />
      </div>

      <Card className="p-4">
        <form method="get" className="flex gap-2">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search by name, contact, email, or phone..."
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
                <th className="px-4 py-2.5 font-medium">Contact</th>
                <th className="px-4 py-2.5 font-medium">Location</th>
                <th className="px-4 py-2.5 font-medium">Deliveries</th>
                {canSeeFinance && <th className="px-4 py-2.5 font-medium">Total Supplied</th>}
                <th className="px-4 py-2.5 font-medium">Last Delivery</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => {
                const totalValue = v.stockReceipts.reduce((s, r) => s + r.totalCost, 0);
                const lastReceipt = v.stockReceipts.sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime())[0];
                return (
                  <tr key={v.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/vendors/${v.id}`} className="font-medium text-brand hover:underline">{v.name}</Link>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      <div>{v.contactName || "—"}</div>
                      <div className="text-xs text-slate-400">{v.email || v.phone || ""}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{[v.city, v.country].filter(Boolean).join(", ") || "—"}</td>
                    <td className="px-4 py-3 text-slate-700">{v.stockReceipts.length}</td>
                    {canSeeFinance && <td className="px-4 py-3 text-slate-700">{formatCurrency(totalValue, currency, locale)}</td>}
                    <td className="px-4 py-3 text-slate-400">{lastReceipt ? formatDate(lastReceipt.receivedAt) : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset", v.active ? "bg-emerald-50 text-emerald-700 ring-emerald-300" : "bg-slate-100 text-slate-500 ring-slate-300")}>
                        {v.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <form action={toggleVendorActive}>
                        <input type="hidden" name="id" value={v.id} />
                        <button type="submit" className="text-xs font-medium text-brand hover:underline">
                          {v.active ? "Deactivate" : "Activate"}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
              {vendors.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">
                    No vendors yet.
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
