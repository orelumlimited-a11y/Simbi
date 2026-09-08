import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getCompanyLocale } from "@/lib/company";

function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role === "DRIVER") {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const canSeeFinance = session.user.role === "ADMIN" || session.user.financeAccess;

  const sp = req.nextUrl.searchParams;
  const where: Prisma.OrderWhereInput = {};
  if (sp.get("status")) where.currentStageKey = sp.get("status")!;
  if (sp.get("driverId")) where.driverId = sp.get("driverId")!;
  if (sp.get("paymentStatus")) where.paymentStatus = sp.get("paymentStatus")!;
  if (sp.get("serviceId")) where.serviceId = sp.get("serviceId")!;
  if (sp.get("priority")) where.priority = sp.get("priority")!;
  if (sp.get("destination")) where.deliveryCity = { contains: sp.get("destination")! };

  const [orders, { currency }] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { customer: true, currentStage: true, driver: true, service: true },
      orderBy: { createdAt: "desc" },
    }),
    getCompanyLocale(),
  ]);

  const headers = [
    "Order Number",
    "Created",
    "Customer",
    "Recipient",
    "Destination City",
    "Destination Country",
    "Service",
    "Priority",
    "Driver",
    "Status",
    "Payment Status",
    ...(canSeeFinance
      ? ["Currency", "Customer Price", "Delivery Cost", "Driver Cost", "Cost of Goods", "Total Charged", "Estimated Profit"]
      : []),
  ];

  const rows = orders.map((o) => [
    o.orderNumber,
    o.createdAt.toISOString(),
    o.customer.name,
    o.recipientName,
    o.deliveryCity,
    o.deliveryCountry,
    o.service.name,
    o.priority,
    o.driver?.name ?? "",
    o.currentStage.label,
    o.paymentStatus,
    ...(canSeeFinance
      ? [currency, o.customerPrice, o.deliveryCost, o.driverCost, o.costOfGoods, o.totalCharged, o.estimatedProfit]
      : []),
  ]);

  const csv = [headers, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
