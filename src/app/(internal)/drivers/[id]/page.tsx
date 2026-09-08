import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, StatCard } from "@/components/ui/Card";
import { StageBadge } from "@/components/ui/StageBadge";
import { formatDate } from "@/lib/format";

export default async function DriverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const driver = await prisma.driver.findUnique({
    where: { id },
    include: {
      vehicle: true,
      orders: { include: { currentStage: true, customer: true }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!driver) notFound();

  const active = driver.orders.filter((o) => !["DELIVERED", "CANCELLED", "RETURNED_TO_SENDER"].includes(o.currentStageKey));
  const completed = driver.orders.filter((o) => o.currentStageKey === "DELIVERED");
  const failed = driver.orders.filter((o) => ["RETURNED_TO_SENDER", "DELIVERY_ATTEMPTED"].includes(o.currentStageKey));

  const onTimeDelivered = completed.filter((o) => o.estimatedDeliveryDate && o.actualDeliveryDate && o.actualDeliveryDate <= o.estimatedDeliveryDate);
  const onTimePct = completed.length ? Math.round((onTimeDelivered.length / completed.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{driver.name}</h1>
          <p className="text-sm text-slate-500">{driver.driverCode} · {driver.status === "ACTIVE" ? "Active" : "Inactive"}</p>
        </div>
        <Link href="/drivers" className="text-sm font-medium text-brand hover:underline">← Back to Drivers</Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Assigned Deliveries" value={String(active.length)} accent="blue" />
        <StatCard label="Completed Deliveries" value={String(completed.length)} accent="green" />
        <StatCard label="Failed Deliveries" value={String(failed.length)} accent="red" />
        <StatCard label="On-Time %" value={`${onTimePct}%`} />
      </div>

      <Card>
        <CardHeader><CardTitle>Driver Profile</CardTitle></CardHeader>
        <div className="grid grid-cols-2 gap-3 p-5 text-sm md:grid-cols-4">
          <Info label="Phone" value={driver.phone} />
          <Info label="Email" value={driver.email} />
          <Info label="Vehicle" value={driver.vehicle ? `${driver.vehicle.type} — ${driver.vehicle.registration}` : "Unassigned"} />
          <Info label="Driver since" value={formatDate(driver.createdAt)} />
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>Assigned Deliveries</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-2.5 font-medium">Order #</th>
                <th className="px-4 py-2.5 font-medium">Customer</th>
                <th className="px-4 py-2.5 font-medium">Destination</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {driver.orders.map((o) => (
                <tr key={o.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3"><Link href={`/orders/${o.id}`} className="font-medium text-brand hover:underline">{o.orderNumber}</Link></td>
                  <td className="px-4 py-3 text-slate-500">{o.customer.name}</td>
                  <td className="px-4 py-3 text-slate-500">{o.deliveryCity}, {o.deliveryCountry}</td>
                  <td className="px-4 py-3"><StageBadge label={o.currentStage.label} color={o.currentStage.color} size="sm" /></td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(o.createdAt)}</td>
                </tr>
              ))}
              {driver.orders.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">No deliveries assigned yet.</td></tr>
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
