import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Card } from "@/components/ui/Card";
import { NewVehicleForm } from "@/components/drivers/NewVehicleForm";
import clsx from "clsx";

export default async function VehiclesPage() {
  const session = await auth();
  const isAdmin = session?.user.role === "ADMIN";

  const vehicles = await prisma.vehicle.findMany({
    include: { drivers: true, orders: { select: { currentStageKey: true } } },
    orderBy: { createdAt: "desc" },
  });

  const statusStyle: Record<string, string> = {
    ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-300",
    MAINTENANCE: "bg-amber-50 text-amber-700 ring-amber-300",
    INACTIVE: "bg-slate-100 text-slate-500 ring-slate-300",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Vehicles</h1>
          <p className="text-sm text-slate-500">{vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""}</p>
        </div>
        {isAdmin && <NewVehicleForm />}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 font-medium">Registration</th>
                <th className="px-4 py-2.5 font-medium">Capacity</th>
                <th className="px-4 py-2.5 font-medium">Assigned Driver(s)</th>
                <th className="px-4 py-2.5 font-medium">Active Deliveries</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => {
                const active = v.orders.filter((o) => !["DELIVERED", "CANCELLED", "RETURNED_TO_SENDER"].includes(o.currentStageKey)).length;
                return (
                  <tr key={v.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{v.type}</td>
                    <td className="px-4 py-3 text-slate-500">{v.registration}</td>
                    <td className="px-4 py-3 text-slate-500">{v.capacityKg ? `${v.capacityKg} kg` : "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{v.drivers.map((d) => d.name).join(", ") || "Unassigned"}</td>
                    <td className="px-4 py-3 text-slate-700">{active}</td>
                    <td className="px-4 py-3">
                      <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset", statusStyle[v.status])}>
                        {v.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {vehicles.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">No vehicles yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
