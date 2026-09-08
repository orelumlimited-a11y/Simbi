import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, formatRelativeDay } from "@/lib/format";
import { getStatusMessage } from "@/lib/track-status";
import { ProgressTimeline } from "@/components/track/ProgressTimeline";
import { Truck, Package, MapPin, Calendar, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export const dynamic = "force-dynamic";

export default async function TrackingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const trackingToken = await prisma.trackingToken.findUnique({
    where: { token },
    include: {
      order: {
        include: {
          currentStage: true,
          service: true,
          packages: true,
          statusEvents: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });

  if (!trackingToken) notFound();

  // Fire-and-forget access tracking — not on the critical path for the customer.
  prisma.trackingToken
    .update({
      where: { id: trackingToken.id },
      data: { lastAccessedAt: new Date(), accessCount: { increment: 1 } },
    })
    .catch(() => {});

  const [company, order] = [await prisma.companySettings.findUnique({ where: { id: "singleton" } }), trackingToken.order];

  const stage = order.currentStage;
  const status = getStatusMessage(order.currentStageKey, order.estimatedDeliveryDate);
  const totalQty = order.packages.reduce((s, p) => s + p.quantity, 0);

  const toneStyles = {
    normal: "bg-blue-50 text-blue-800 ring-blue-200",
    success: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    warning: "bg-amber-50 text-amber-800 ring-amber-200",
  } as const;

  const ToneIcon = status.tone === "success" ? CheckCircle2 : status.tone === "warning" ? AlertTriangle : Truck;

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-2 px-4 py-8 text-center">
          <Logo size={56} className="rounded-xl" />
          <h1 className="text-lg font-semibold text-slate-900">{company?.name ?? "Simbi Logistics"}</h1>
          <p className="text-sm text-slate-500">Track Your Delivery</p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        {order.currentStageKey === "CANCELLED" ? (
          <div className="flex items-center gap-3 rounded-xl bg-slate-100 p-5 ring-1 ring-inset ring-slate-200">
            <XCircle className="h-6 w-6 shrink-0 text-slate-500" />
            <div>
              <p className="font-semibold text-slate-800">This order has been cancelled.</p>
              <p className="text-sm text-slate-500">Please contact us if you have any questions.</p>
            </div>
          </div>
        ) : (
          <div className={`rounded-xl p-5 ring-1 ring-inset ${toneStyles[status.tone]}`}>
            <div className="flex items-start gap-3">
              <ToneIcon className="h-6 w-6 shrink-0" />
              <div>
                <p className="text-lg font-semibold">{status.headline}</p>
                {status.sub && <p className="mt-1 text-sm opacity-90">{status.sub}</p>}
                {status.tone !== "warning" && order.currentStageKey !== "DELIVERED" && (
                  <p className="mt-1 text-sm opacity-80">
                    Estimated delivery: {formatRelativeDay(order.estimatedDeliveryDate)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs text-slate-400">Tracking Number</p>
              <p className="font-mono text-sm font-semibold text-slate-800">{order.orderNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Order Date</p>
              <p className="text-sm font-medium text-slate-700">{formatDate(order.createdAt)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm">
            <div>
              <p className="text-xs text-slate-400">Recipient</p>
              <p className="font-medium text-slate-700">{order.recipientName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Destination</p>
              <p className="font-medium text-slate-700">{order.deliveryCity}, {order.deliveryCountry}</p>
            </div>
          </div>
        </div>

        {order.currentStageKey !== "CANCELLED" && (
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Delivery Progress</h2>
            <ProgressTimeline
              currentStageKey={order.currentStageKey}
              events={order.statusEvents}
              isProblem={stage.isProblem}
              isFailure={stage.isTerminalFailure}
            />
          </div>
        )}

        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Delivery Details</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Package className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="text-slate-500">Package{totalQty > 1 ? "s" : ""}:</span>
              <span className="font-medium text-slate-700">
                {totalQty} × {order.packages[0]?.packageType ?? "Parcel"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="text-slate-500">Destination:</span>
              <span className="font-medium text-slate-700">{order.deliveryCity}, {order.deliveryCountry}</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="text-slate-500">Estimated delivery:</span>
              <span className="font-medium text-slate-700">{formatDate(order.estimatedDeliveryDate)}</span>
            </div>
            <div className="flex items-center gap-3">
              <Truck className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="text-slate-500">Service:</span>
              <span className="font-medium text-slate-700">{order.service.name}</span>
            </div>
            {order.deliveryInstructions && (
              <div className="rounded-lg bg-slate-50 px-3 py-2 text-slate-600">
                <span className="text-xs text-slate-400">Delivery instructions: </span>
                {order.deliveryInstructions}
              </div>
            )}
          </dl>
        </div>

        <p className="pt-4 text-center text-xs text-slate-400">
          Need help? Contact {company?.email ?? "support"} {company?.phone ? `or call ${company.phone}` : ""}
        </p>
      </main>
    </div>
  );
}
