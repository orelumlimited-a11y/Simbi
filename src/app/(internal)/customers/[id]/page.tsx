import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Card, CardHeader, CardTitle, StatCard } from "@/components/ui/Card";
import { StageBadge, PaymentBadge } from "@/components/ui/StageBadge";
import { formatCurrency, formatDate } from "@/lib/format";
import { getCompanyLocale } from "@/lib/company";
import { toggleCustomerChannel } from "@/lib/actions/customers";
import { Mail, MessageSquare, Phone } from "lucide-react";
import clsx from "clsx";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const canSeeFinance = session?.user.role === "ADMIN" || session?.user.financeAccess;

  const [customer, { currency, locale }] = await Promise.all([
    prisma.customer.findUnique({
      where: { id },
      include: {
        orders: { include: { currentStage: true }, orderBy: { createdAt: "desc" } },
      },
    }),
    getCompanyLocale(),
  ]);

  if (!customer) notFound();

  const totalSpent = customer.orders.reduce((s, o) => s + o.totalCharged, 0);
  const outstanding = customer.orders
    .filter((o) => o.paymentStatus === "UNPAID" || o.paymentStatus === "PARTIAL")
    .reduce((s, o) => s + o.totalCharged, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{customer.name}</h1>
          <p className="text-sm text-slate-500">{customer.company || "Individual customer"} · Customer since {formatDate(customer.createdAt)}</p>
        </div>
        <Link href="/customers" className="text-sm font-medium text-brand hover:underline">← Back to Customers</Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Orders" value={String(customer.orders.length)} />
        {canSeeFinance && <StatCard label="Total Spent" value={formatCurrency(totalSpent, currency, locale)} accent="green" />}
        {canSeeFinance && <StatCard label="Outstanding Balance" value={formatCurrency(outstanding, currency, locale)} accent={outstanding > 0 ? "red" : "default"} />}
        <StatCard label="Last Order" value={customer.orders[0] ? formatDate(customer.orders[0].createdAt) : "—"} />
      </div>

      <Card>
        <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
        <div className="grid grid-cols-2 gap-3 p-5 text-sm md:grid-cols-4">
          <Info label="Email" value={customer.email} />
          <Info label="Phone" value={customer.phone} />
          <Info label="Address" value={customer.address || "—"} />
          <Info label="City" value={[customer.city, customer.country].filter(Boolean).join(", ") || "—"} />
        </div>
        <div className="border-t border-slate-100 px-5 py-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Contact Preferences</p>
          <div className="flex flex-wrap gap-2">
            <ChannelPill customerId={customer.id} channel="EMAIL" active={customer.emailOptIn} icon={Mail} label="Email" />
            <ChannelPill customerId={customer.id} channel="SMS" active={customer.smsOptIn} icon={MessageSquare} label="SMS" />
            <ChannelPill customerId={customer.id} channel="WHATSAPP" active={customer.whatsappOptIn} icon={Phone} label="WhatsApp" />
          </div>
          <p className="mt-2 text-xs text-slate-400">Delivery notifications are only sent on channels this customer has opted into.</p>
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>Order History</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-2.5 font-medium">Order #</th>
                <th className="px-4 py-2.5 font-medium">Destination</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Created</th>
                {canSeeFinance && <th className="px-4 py-2.5 font-medium">Price</th>}
                <th className="px-4 py-2.5 font-medium">Payment</th>
              </tr>
            </thead>
            <tbody>
              {customer.orders.map((o) => (
                <tr key={o.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/orders/${o.id}`} className="font-medium text-brand hover:underline">{o.orderNumber}</Link>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{o.deliveryCity}, {o.deliveryCountry}</td>
                  <td className="px-4 py-3"><StageBadge label={o.currentStage.label} color={o.currentStage.color} size="sm" /></td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(o.createdAt)}</td>
                  {canSeeFinance && <td className="px-4 py-3 text-slate-700">{formatCurrency(o.totalCharged, currency, locale)}</td>}
                  <td className="px-4 py-3"><PaymentBadge status={o.paymentStatus} /></td>
                </tr>
              ))}
              {customer.orders.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">No orders yet.</td></tr>
              )}
            </tbody>
          </table>
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

function ChannelPill({
  customerId,
  channel,
  active,
  icon: Icon,
  label,
}: {
  customerId: string;
  channel: "EMAIL" | "SMS" | "WHATSAPP";
  active: boolean;
  icon: typeof Mail;
  label: string;
}) {
  return (
    <form action={toggleCustomerChannel}>
      <input type="hidden" name="id" value={customerId} />
      <input type="hidden" name="channel" value={channel} />
      <button
        type="submit"
        className={clsx(
          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition-colors",
          active ? "bg-brand text-white ring-brand" : "bg-white text-slate-500 ring-slate-300 hover:bg-slate-50"
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        {label}
      </button>
    </form>
  );
}
