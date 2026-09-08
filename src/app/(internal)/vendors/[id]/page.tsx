import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Card, CardHeader, CardTitle, StatCard } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/format";
import { getCompanyLocale } from "@/lib/company";
import { LogStockReceiptForm } from "@/components/vendors/LogStockReceiptForm";

export default async function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const canSeeFinance = session?.user.role === "ADMIN" || session?.user.financeAccess;

  const [vendor, products, { currency, locale }] = await Promise.all([
    prisma.vendor.findUnique({
      where: { id },
      include: {
        stockReceipts: { include: { product: true, receivedBy: true }, orderBy: { receivedAt: "desc" } },
      },
    }),
    prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    getCompanyLocale(),
  ]);

  if (!vendor) notFound();

  const totalValue = vendor.stockReceipts.reduce((s, r) => s + r.totalCost, 0);
  const totalUnits = vendor.stockReceipts.reduce((s, r) => s + r.quantity, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{vendor.name}</h1>
          <p className="text-sm text-slate-500">{vendor.contactName || "No contact set"} · Vendor since {formatDate(vendor.createdAt)}</p>
        </div>
        <Link href="/vendors" className="text-sm font-medium text-brand hover:underline">← Back to Vendors</Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Deliveries" value={String(vendor.stockReceipts.length)} />
        <StatCard label="Units Supplied" value={String(totalUnits)} />
        {canSeeFinance && <StatCard label="Total Value" value={formatCurrency(totalValue, currency, locale)} accent="green" />}
      </div>

      <Card>
        <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
        <div className="grid grid-cols-2 gap-3 p-5 text-sm md:grid-cols-4">
          <Info label="Contact person" value={vendor.contactName || "—"} />
          <Info label="Email" value={vendor.email || "—"} />
          <Info label="Phone" value={vendor.phone || "—"} />
          <Info label="Location" value={[vendor.address, vendor.city, vendor.country].filter(Boolean).join(", ") || "—"} />
        </div>
        {vendor.notes && (
          <div className="border-t border-slate-100 px-5 py-4 text-sm text-slate-600">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Notes</p>
            {vendor.notes}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader><CardTitle>Stock Received</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-2.5 font-medium">Date</th>
                <th className="px-4 py-2.5 font-medium">Product</th>
                <th className="px-4 py-2.5 font-medium">Quantity</th>
                {canSeeFinance && <th className="px-4 py-2.5 font-medium">Unit Cost</th>}
                {canSeeFinance && <th className="px-4 py-2.5 font-medium">Total</th>}
                <th className="px-4 py-2.5 font-medium">Logged By</th>
                <th className="px-4 py-2.5 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {vendor.stockReceipts.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3 text-slate-500">{formatDate(r.receivedAt)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/vendors/products/${r.productId}`} className="font-medium text-brand hover:underline">{r.product.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{r.quantity} {r.product.unit}</td>
                  {canSeeFinance && <td className="px-4 py-3 text-slate-500">{formatCurrency(r.unitCost, currency, locale)}</td>}
                  {canSeeFinance && <td className="px-4 py-3 font-medium text-slate-800">{formatCurrency(r.totalCost, currency, locale)}</td>}
                  <td className="px-4 py-3 text-slate-400">{r.receivedBy?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-400">{r.note || "—"}</td>
                </tr>
              ))}
              {vendor.stockReceipts.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">No stock received from this vendor yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 p-5">
          <LogStockReceiptForm
            products={products.map((p) => ({ id: p.id, name: p.name }))}
            vendors={[{ id: vendor.id, name: vendor.name }]}
            defaultVendorId={vendor.id}
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
