import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { StageBadge } from "@/components/ui/StageBadge";
import { formatDate } from "@/lib/format";
import { StatusUpdateForm } from "@/components/orders/StatusUpdateForm";
import { DeliveryNoteForm } from "@/components/orders/DeliveryNoteForm";
import { StatusTimeline } from "@/components/orders/StatusTimeline";
import { Phone, MapPin, ChevronLeft } from "lucide-react";

export default async function DriverOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const driver = await prisma.driver.findUnique({ where: { userId: session!.user.id } });

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      currentStage: true,
      packages: true,
      statusEvents: { include: { changedBy: true, newStage: true }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) notFound();
  if (session?.user.role === "DRIVER" && (!driver || order.driverId !== driver.id)) {
    redirect("/driver");
  }

  const stages = await prisma.deliveryStage.findMany({
    where: { active: true, key: { in: ["PICKED_UP", "AT_SORTING_FACILITY", "IN_TRANSIT", "ARRIVED_AT_LOCAL_FACILITY", "OUT_FOR_DELIVERY", "DELIVERED", "DELIVERY_ATTEMPTED", "DELIVERY_DELAYED", "ADDRESS_ISSUE", "CUSTOMER_UNAVAILABLE"] } },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-4">
      <Link href="/driver" className="flex items-center gap-1 text-sm font-medium text-brand">
        <ChevronLeft className="h-4 w-4" /> Back to deliveries
      </Link>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-slate-900">{order.orderNumber}</p>
          <StageBadge label={order.currentStage.label} color={order.currentStage.color} />
        </div>
        <p className="mt-1 text-xs text-slate-400">Due {formatDate(order.estimatedDeliveryDate)}</p>
      </div>

      <Section title="Recipient">
        <p className="font-medium text-slate-800">{order.recipientName}</p>
        <a href={`tel:${order.recipientPhone}`} className="mt-1 flex items-center gap-1.5 text-sm text-brand">
          <Phone className="h-3.5 w-3.5" /> {order.recipientPhone}
        </a>
      </Section>

      <Section title="Pickup Address">
        <p className="flex items-start gap-1.5 text-sm text-slate-700">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          {order.pickupAddress}, {order.pickupCity}, {order.pickupPostcode}, {order.pickupCountry}
        </p>
      </Section>

      <Section title="Delivery Address">
        <p className="flex items-start gap-1.5 text-sm text-slate-700">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          {order.deliveryAddress}, {order.deliveryCity}, {order.deliveryPostcode}, {order.deliveryCountry}
        </p>
        {order.deliveryInstructions && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{order.deliveryInstructions}</p>
        )}
      </Section>

      <Section title="Package Information">
        {order.packages.map((p) => (
          <div key={p.id} className="mb-2 text-sm text-slate-700 last:mb-0">
            {p.quantity} × {p.packageType} — {p.description} ({p.weightKg} kg)
            {p.specialHandling && <p className="text-xs text-amber-700">⚠ {p.specialHandling}</p>}
          </div>
        ))}
      </Section>

      <Section title="Update Status">
        <StatusUpdateForm orderId={order.id} stages={stages} currentKey={order.currentStageKey} />
      </Section>

      <Section title="Delivery Notes">
        <DeliveryNoteForm orderId={order.id} />
      </Section>

      <Section title="History">
        <StatusTimeline events={order.statusEvents} />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h2>
      {children}
    </div>
  );
}
