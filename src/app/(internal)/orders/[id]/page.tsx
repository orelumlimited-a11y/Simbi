import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { StageBadge, PaymentBadge } from "@/components/ui/StageBadge";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { getCompanyLocale } from "@/lib/company";
import { PRIORITY_LABELS, PAYMENT_STATUS_LABELS, type Priority, type PaymentStatus } from "@/lib/constants";
import { StatusTimeline } from "@/components/orders/StatusTimeline";
import { StatusUpdateForm } from "@/components/orders/StatusUpdateForm";
import { AssignDriverForm } from "@/components/orders/AssignDriverForm";
import { TrackingLinkActions } from "@/components/orders/TrackingLinkActions";
import { CancelOrderForm, DeleteOrderForm } from "@/components/orders/CancelOrderForm";
import { DeliveryNoteForm } from "@/components/orders/DeliveryNoteForm";
import { ResendNotificationButton } from "@/components/orders/ResendNotificationButton";
import { ManualNotifyForm } from "@/components/orders/ManualNotifyForm";
import { CheckCircle2, Mail, MessageSquare, Phone } from "lucide-react";
import clsx from "clsx";

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;
  const session = await auth();
  const canSeeFinance = session?.user.role === "ADMIN" || session?.user.financeAccess;
  const isAdmin = session?.user.role === "ADMIN";

  const [order, stages, drivers, vehicles, { currency, locale }] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        currentStage: true,
        driver: true,
        vehicle: true,
        service: true,
        packages: { include: { product: true } },
        trackingToken: true,
        createdBy: true,
        statusEvents: { include: { changedBy: true, newStage: true }, orderBy: { createdAt: "desc" } },
        payments: true,
        notifications: { orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.deliveryStage.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.driver.findMany({ where: { status: "ACTIVE" } }),
    prisma.vehicle.findMany({ where: { status: "ACTIVE" } }),
    getCompanyLocale(),
  ]);

  if (!order) notFound();

  const totalCosts = order.deliveryCost + order.driverCost + order.costOfGoods;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      {created && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-inset ring-emerald-200">
          <CheckCircle2 className="h-4 w-4" />
          Order created successfully. Share the tracking link with your customer below.
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900">{order.orderNumber}</h1>
            <StageBadge label={order.currentStage.label} color={order.currentStage.color} />
          </div>
          <p className="text-sm text-slate-500">Created {formatDateTime(order.createdAt)} by {order.createdBy.name}</p>
        </div>
        <Link href="/orders" className="text-sm font-medium text-brand hover:underline">
          ← Back to Orders
        </Link>
      </div>

      <Card className="p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Public Tracking Link</p>
        {order.trackingToken && <TrackingLinkActions token={order.trackingToken.token} />}
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
            <CardBody className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Name" value={order.customer.name} />
              <Info label="Company" value={order.customer.company || "—"} />
              <Info label="Email" value={order.customer.email} />
              <Info label="Phone" value={order.customer.phone} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>Sender</CardTitle></CardHeader>
            <CardBody className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Name" value={order.senderName} />
              <Info label="Phone" value={order.senderPhone} />
              <Info label="Address" value={order.pickupAddress} className="col-span-2" />
              <Info label="City" value={order.pickupCity} />
              <Info label="Postcode" value={order.pickupPostcode} />
              <Info label="Country" value={order.pickupCountry} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>Recipient</CardTitle></CardHeader>
            <CardBody className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Name" value={order.recipientName} />
              <Info label="Phone" value={order.recipientPhone} />
              <Info label="Address" value={order.deliveryAddress} className="col-span-2" />
              <Info label="City" value={order.deliveryCity} />
              <Info label="Postcode" value={order.deliveryPostcode} />
              <Info label="Country" value={order.deliveryCountry} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>Package{order.packages.length > 1 ? "s" : ""}</CardTitle></CardHeader>
            <CardBody className="space-y-3">
              {order.packages.map((p) => (
                <div key={p.id} className="rounded-lg border border-slate-100 p-3 text-sm">
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <Info label="Description" value={p.description} className="col-span-2 md:col-span-1" />
                    <Info label="Type" value={p.packageType} />
                    <Info label="Qty" value={String(p.quantity)} />
                    <Info label="Weight" value={`${p.weightKg} kg`} />
                    {p.lengthCm && <Info label="Dimensions" value={`${p.lengthCm}×${p.widthCm}×${p.heightCm} cm`} />}
                    {p.product && (
                      <Info
                        label="From vendor stock"
                        value={`${p.product.name} (${canSeeFinance ? formatCurrency(p.costOfGoods, currency, locale) : `${p.quantity} ${p.product.unit}`})`}
                        className="col-span-2 md:col-span-4"
                      />
                    )}
                    {p.specialHandling && <Info label="Special handling" value={p.specialHandling} className="col-span-2 md:col-span-4" />}
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>Delivery</CardTitle></CardHeader>
            <CardBody className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Service" value={order.service.name} />
              <Info label="Priority" value={PRIORITY_LABELS[order.priority as Priority] ?? order.priority} />
              <Info label="Driver" value={order.driver?.name || "Unassigned"} />
              <Info label="Vehicle" value={order.vehicle ? `${order.vehicle.type} — ${order.vehicle.registration}` : "Unassigned"} />
              <Info label="Estimated pickup" value={formatDateTime(order.estimatedPickupDate)} />
              <Info label="Estimated delivery" value={formatDateTime(order.estimatedDeliveryDate)} />
              {order.actualDeliveryDate && <Info label="Actual delivery" value={formatDateTime(order.actualDeliveryDate)} />}
              {order.deliveryInstructions && <Info label="Instructions" value={order.deliveryInstructions} className="col-span-2" />}
            </CardBody>
          </Card>

          {canSeeFinance && (
            <Card>
              <CardHeader><CardTitle>Financials</CardTitle></CardHeader>
              <CardBody className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
                <Info label="Customer price" value={formatCurrency(order.customerPrice, currency, locale)} />
                <Info label="Delivery cost" value={formatCurrency(order.deliveryCost, currency, locale)} />
                <Info label="Driver cost" value={formatCurrency(order.driverCost, currency, locale)} />
                {order.costOfGoods > 0 && <Info label="Cost of goods" value={formatCurrency(order.costOfGoods, currency, locale)} />}
                <Info label="Additional fees" value={formatCurrency(order.additionalFees, currency, locale)} />
                <Info label="Discount" value={formatCurrency(order.discount, currency, locale)} />
                <Info label="Tax / VAT" value={formatCurrency(order.tax, currency, locale)} />
                <Info label="Total charged" value={formatCurrency(order.totalCharged, currency, locale)} />
                <Info label="Total costs" value={formatCurrency(totalCosts, currency, locale)} />
                <Info
                  label="Estimated profit"
                  value={formatCurrency(order.estimatedProfit, currency, locale)}
                  valueClassName={order.estimatedProfit >= 0 ? "text-emerald-600" : "text-red-600"}
                />
                <div>
                  <p className="text-xs text-slate-500">Payment status</p>
                  <div className="mt-1"><PaymentBadge status={order.paymentStatus} /></div>
                </div>
                <Info label="Payment method" value={order.paymentMethod ?? "—"} />
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Status Timeline</CardTitle></CardHeader>
            <CardBody>
              <StatusTimeline events={order.statusEvents} />
              <div className="mt-4 border-t border-slate-100 pt-4">
                <DeliveryNoteForm orderId={order.id} />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
            <CardBody className="space-y-2">
              {order.notifications.map((n) => (
                <div key={n.id} className="flex items-start gap-3 rounded-lg border border-slate-100 p-3 text-sm">
                  <ChannelIcon channel={n.channel} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-800">{n.channel}</span>
                      <span className="text-xs text-slate-400">to {n.recipient}</span>
                      <NotificationStatusBadge status={n.status} />
                    </div>
                    <p className="text-xs text-slate-400">{n.eventKey.replace(/_/g, " ")} · {formatDateTime(n.createdAt)}</p>
                    {n.status === "FAILED" && n.payload && (
                      <p className="mt-1 truncate text-xs text-red-600">{n.payload.split("\n")[0]}</p>
                    )}
                  </div>
                  {n.status === "FAILED" && <ResendNotificationButton notificationId={n.id} orderId={order.id} />}
                </div>
              ))}
              {order.notifications.length === 0 && (
                <p className="text-sm text-slate-400">No notifications sent yet for this order.</p>
              )}
              <div className="border-t border-slate-100 pt-3">
                <ManualNotifyForm
                  orderId={order.id}
                  currentStageKey={order.currentStageKey}
                  hasEmail={!!order.customer.email}
                  hasPhone={!!order.customer.phone}
                />
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
            <CardBody className="space-y-3">
              <StatusUpdateForm orderId={order.id} stages={stages} currentKey={order.currentStageKey} />
              <AssignDriverForm orderId={order.id} drivers={drivers} vehicles={vehicles} currentDriverId={order.driverId} />
              {order.currentStageKey !== "CANCELLED" && order.currentStageKey !== "DELIVERED" && (
                <CancelOrderForm orderId={order.id} />
              )}
              {isAdmin && (
                <div className="border-t border-slate-100 pt-3">
                  <DeleteOrderForm orderId={order.id} orderNumber={order.orderNumber} />
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
            <CardBody className="space-y-2 text-sm">
              <Info label="Order number" value={order.orderNumber} />
              <Info label="Created" value={formatDate(order.createdAt)} />
              <Info label="Estimated delivery" value={formatDate(order.estimatedDeliveryDate)} />
              <Info label="Payment status" value={PAYMENT_STATUS_LABELS[order.paymentStatus as PaymentStatus] ?? order.paymentStatus} />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, className, valueClassName }: { label: string; value: string; className?: string; valueClassName?: string }) {
  return (
    <div className={className}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`font-medium text-slate-800 ${valueClassName ?? ""}`}>{value}</p>
    </div>
  );
}

function ChannelIcon({ channel }: { channel: string }) {
  const Icon = channel === "EMAIL" ? Mail : channel === "SMS" ? MessageSquare : Phone;
  return (
    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
      <Icon className="h-3.5 w-3.5" />
    </span>
  );
}

function NotificationStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    SENT: "bg-emerald-50 text-emerald-700 ring-emerald-300",
    FAILED: "bg-red-50 text-red-700 ring-red-300",
    PENDING: "bg-amber-50 text-amber-700 ring-amber-300",
    DISABLED: "bg-slate-100 text-slate-500 ring-slate-300",
  };
  return (
    <span className={clsx("rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", styles[status] ?? styles.PENDING)}>
      {status}
    </span>
  );
}
