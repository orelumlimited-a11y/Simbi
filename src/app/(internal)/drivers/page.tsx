import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Card } from "@/components/ui/Card";
import { NewDriverForm } from "@/components/drivers/NewDriverForm";
import clsx from "clsx";
import { updateDriverStatus } from "@/lib/actions/drivers";

export default async function DriversPage() {
  const session = await auth();
  const isAdmin = session?.user.role === "ADMIN";

  const [drivers, vehicles] = await Promise.all([
    prisma.driver.findMany({
      include: { vehicle: true, orders: { select: { currentStageKey: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vehicle.findMany({ where: { status: "ACTIVE" } }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Drivers</h1>
          <p className="text-sm text-slate-500">{drivers.length} driver{drivers.length !== 1 ? "s" : ""}</p>
        </div>
        {isAdmin && <NewDriverForm vehicles={vehicles} />}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-2.5 font-medium">Driver</th>
                <th className="px-4 py-2.5 font-medium">Code</th>
                <th className="px-4 py-2.5 font-medium">Contact</th>
                <th className="px-4 py-2.5 font-medium">Vehicle</th>
                <th className="px-4 py-2.5 font-medium">Active Deliveries</th>
                <th className="px-4 py-2.5 font-medium">Completed</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                {isAdmin && <th className="px-4 py-2.5 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => {
                const active = d.orders.filter((o) => !["DELIVERED", "CANCELLED", "RETURNED_TO_SENDER"].includes(o.currentStageKey)).length;
                const completed = d.orders.filter((o) => o.currentStageKey === "DELIVERED").length;
                return (
                  <tr key={d.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/drivers/${d.id}`} className="font-medium text-brand hover:underline">{d.name}</Link>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{d.driverCode}</td>
                    <td className="px-4 py-3 text-slate-500">
                      <div>{d.email}</div>
                      <div className="text-xs text-slate-400">{d.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{d.vehicle ? `${d.vehicle.type} — ${d.vehicle.registration}` : "Unassigned"}</td>
                    <td className="px-4 py-3 text-slate-700">{active}</td>
                    <td className="px-4 py-3 text-slate-700">{completed}</td>
                    <td className="px-4 py-3">
                      <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset", d.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 ring-emerald-300" : "bg-slate-100 text-slate-500 ring-slate-300")}>
                        {d.status === "ACTIVE" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <form action={updateDriverStatus}>
                          <input type="hidden" name="id" value={d.id} />
                          <input type="hidden" name="status" value={d.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"} />
                          <button type="submit" className="text-xs font-medium text-brand hover:underline">
                            {d.status === "ACTIVE" ? "Deactivate" : "Activate"}
                          </button>
                        </form>
                      </td>
                    )}
                  </tr>
                );
              })}
              {drivers.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">No drivers yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
