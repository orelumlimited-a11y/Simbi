import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { StageBadge } from "@/components/ui/StageBadge";
import { formatRelativeDay } from "@/lib/format";
import { Package, MapPin, ChevronRight } from "lucide-react";

export default async function DriverDashboardPage() {
  const session = await auth();
  const driver = await prisma.driver.findUnique({ where: { userId: session!.user.id } });

  if (!driver) {
    return (
      <div className="rounded-xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
        No driver profile is linked to this account.
      </div>
    );
  }

  const orders = await prisma.order.findMany({
    where: { driverId: driver.id, currentStageKey: { notIn: ["DELIVERED", "CANCELLED", "RETURNED_TO_SENDER"] } },
    include: { currentStage: true, customer: true, packages: true },
    orderBy: { estimatedDeliveryDate: "asc" },
  });

  const completedToday = await prisma.order.count({
    where: {
      driverId: driver.id,
      currentStageKey: "DELIVERED",
      actualDeliveryDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    },
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Assigned Today</p>
          <p className="text-2xl font-semibold text-slate-900">{orders.length}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Completed Today</p>
          <p className="text-2xl font-semibold text-emerald-600">{completedToday}</p>
        </div>
      </div>

      <h2 className="text-sm font-semibold text-slate-700">My Deliveries</h2>

      <div className="space-y-3">
        {orders.map((o) => (
          <Link
            key={o.id}
            href={`/driver/${o.id}`}
            className="flex items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm active:bg-slate-50"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-semibold text-slate-900">{o.orderNumber}</p>
                <StageBadge label={o.currentStage.label} color={o.currentStage.color} size="sm" />
              </div>
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="h-3.5 w-3.5" /> {o.deliveryAddress}, {o.deliveryCity}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                <Package className="h-3.5 w-3.5" /> {o.packages.length} package{o.packages.length !== 1 ? "s" : ""} · Due {formatRelativeDay(o.estimatedDeliveryDate)}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
          </Link>
        ))}
        {orders.length === 0 && (
          <div className="rounded-xl bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
            No active deliveries assigned right now.
          </div>
        )}
      </div>
    </div>
  );
}
