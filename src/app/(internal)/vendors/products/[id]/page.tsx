import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Card, CardHeader, CardTitle, StatCard } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/format";
import { getCompanyLocale } from "@/lib/company";
import { LogStockReceiptForm } from "@/components/vendors/LogStockReceiptForm";
import { ArrowLeft } from "lucide-react";
import clsx from "clsx";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const canSeeFinance = session?.user.role === "ADMIN" || session?.user.financeAccess;

  const [product, vendors, { currency, locale }] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        stockReceipts: { include: { vendor: true, receivedBy: true }, orderBy: { receivedAt: "desc" } },
      },
    }),
    prisma.vendor.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    getCompanyLocale(),
  ]);

  if (!product) notFound();

  const low = product.currentStock <= product.reorderLevel;
  const totalReceived = product.stockReceipts.reduce((s, r) => s + r.quantity, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <Link href="/vendors/products" className="flex items-center gap-1 text-xs font-medium text-brand hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Products
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{product.name}</h1>
          <p className="text-sm text-slate-500">{product.sku ? `SKU: ${product.sku}` : "No SKU set"}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Current Stock" value={`${product.currentStock} ${product.unit}`} accent={low ? "red" : "default"} />
        <StatCard label="Reorder Level" value={`${product.reorderLevel} ${product.unit}`} />
        <StatCard label="Total Ever Received" value={`${totalReceived} ${product.unit}`} />
        {canSeeFinance && <StatCard label="Current Stock Value" value={formatCurrency(product.currentStock * product.currentUnitCost, currency, locale)} accent="green" />}
      </div>

      {low && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
          Stock is at or below the reorder level — consider logging a new delivery from a vendor.
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Product Details</CardTitle></CardHeader>
        <div className="grid grid-cols-2 gap-3 p-5 text-sm md:grid-cols-4">
          <Info label="Unit" value={product.unit} />
          {canSeeFinance && <Info label="Current unit cost" value={formatCurrency(product.currentUnitCost, currency, locale)} />}
          <Info label="Status" value={product.active ? "Active" : "Inactive"} />
        </div>
        {product.description && (
          <div className="border-t border-slate-100 px-5 py-4 text-sm text-slate-600">{product.description}</div>
        )}
      </Card>

      <Card>
        <CardHeader><CardTitle>Stock Received History</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-2.5 font-medium">Date</th>
                <th className="px-4 py-2.5 font-medium">Vendor</th>
                <th className="px-4 py-2.5 font-medium">Quantity</th>
                {canSeeFinance && <th className="px-4 py-2.5 font-medium">Unit Cost</th>}
                {canSeeFinance && <th className="px-4 py-2.5 font-medium">Total</th>}
                <th className="px-4 py-2.5 font-medium">Logged By</th>
              </tr>
            </thead>
            <tbody>
              {product.stockReceipts.map((r) => (
                <tr key={r.id} className={clsx("border-b border-slate-50 last:border-0")}>
                  <td className="px-4 py-3 text-slate-500">{formatDate(r.receivedAt)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/vendors/${r.vendorId}`} className="font-medium text-brand hover:underline">{r.vendor.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">+{r.quantity} {product.unit}</td>
                  {canSeeFinance && <td className="px-4 py-3 text-slate-500">{formatCurrency(r.unitCost, currency, locale)}</td>}
                  {canSeeFinance && <td className="px-4 py-3 font-medium text-slate-800">{formatCurrency(r.totalCost, currency, locale)}</td>}
                  <td className="px-4 py-3 text-slate-400">{r.receivedBy?.name ?? "—"}</td>
                </tr>
              ))}
              {product.stockReceipts.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">No stock received for this product yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 p-5">
          <LogStockReceiptForm
            products={[{ id: product.id, name: product.name }]}
            vendors={vendors.map((v) => ({ id: v.id, name: v.name }))}
            defaultProductId={product.id}
          />
        </div>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-medium text-slate-800">{value}</p>
    </div>
  );
}
