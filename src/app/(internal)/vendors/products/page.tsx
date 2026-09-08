import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Card, StatCard } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/format";
import { getCompanyLocale } from "@/lib/company";
import { NewProductForm } from "@/components/vendors/NewProductForm";
import { LogStockReceiptForm } from "@/components/vendors/LogStockReceiptForm";
import { toggleProductActive } from "@/lib/actions/products";
import { ArrowLeft } from "lucide-react";
import clsx from "clsx";

export default async function ProductsPage() {
  const session = await auth();
  const canSeeFinance = session?.user.role === "ADMIN" || session?.user.financeAccess;

  const [products, vendors, { currency, locale }] = await Promise.all([
    prisma.product.findMany({ orderBy: { name: "asc" } }),
    prisma.vendor.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    getCompanyLocale(),
  ]);

  const totalStockValue = products.reduce((s, p) => s + p.currentStock * p.currentUnitCost, 0);
  const lowStock = products.filter((p) => p.active && p.currentStock <= p.reorderLevel);

  return (
    <div className="space-y-4">
      <div>
        <Link href="/vendors" className="flex items-center gap-1 text-xs font-medium text-brand hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Vendor Management
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Products & Stock</h1>
          <p className="text-sm text-slate-500">{products.length} product{products.length !== 1 ? "s" : ""} in the catalog</p>
        </div>
        <div className="flex gap-2">
          <LogStockReceiptForm
            products={products.filter((p) => p.active).map((p) => ({ id: p.id, name: p.name }))}
            vendors={vendors.map((v) => ({ id: v.id, name: v.name }))}
          />
          <NewProductForm />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Units in Stock" value={String(products.reduce((s, p) => s + p.currentStock, 0))} />
        <StatCard label="Low Stock Items" value={String(lowStock.length)} accent={lowStock.length > 0 ? "orange" : "default"} />
        {canSeeFinance && <StatCard label="Stock Value" value={formatCurrency(totalStockValue, currency, locale)} accent="green" />}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-2.5 font-medium">Product</th>
                <th className="px-4 py-2.5 font-medium">SKU</th>
                <th className="px-4 py-2.5 font-medium">In Stock</th>
                <th className="px-4 py-2.5 font-medium">Reorder Level</th>
                {canSeeFinance && <th className="px-4 py-2.5 font-medium">Unit Cost</th>}
                {canSeeFinance && <th className="px-4 py-2.5 font-medium">Stock Value</th>}
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const low = p.currentStock <= p.reorderLevel;
                return (
                  <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/vendors/products/${p.id}`} className="font-medium text-brand hover:underline">{p.name}</Link>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{p.sku || "—"}</td>
                    <td className={clsx("px-4 py-3 font-medium", low ? "text-red-600" : "text-slate-700")}>
                      {p.currentStock} {p.unit}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{p.reorderLevel} {p.unit}</td>
                    {canSeeFinance && <td className="px-4 py-3 text-slate-500">{formatCurrency(p.currentUnitCost, currency, locale)}</td>}
                    {canSeeFinance && <td className="px-4 py-3 text-slate-700">{formatCurrency(p.currentStock * p.currentUnitCost, currency, locale)}</td>}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {low && (
                          <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-300">
                            Low Stock
                          </span>
                        )}
                        <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset", p.active ? "bg-emerald-50 text-emerald-700 ring-emerald-300" : "bg-slate-100 text-slate-500 ring-slate-300")}>
                          {p.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <form action={toggleProductActive}>
                        <input type="hidden" name="id" value={p.id} />
                        <button type="submit" className="text-xs font-medium text-brand hover:underline">
                          {p.active ? "Deactivate" : "Activate"}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">
                    No products yet. Create one to start logging stock.
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
