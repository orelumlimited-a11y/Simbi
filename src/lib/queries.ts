import { prisma } from "@/lib/prisma";
import { startOfDay, subDays, format } from "date-fns";

export async function getDashboardStats() {
  const today = startOfDay(new Date());

  const [totalOrders, deliveredToday, delayedCount, orders] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { currentStageKey: "DELIVERED", actualDeliveryDate: { gte: today } } }),
    prisma.order.count({ where: { currentStageKey: { in: ["DELIVERY_DELAYED", "ADDRESS_ISSUE", "CUSTOMER_UNAVAILABLE"] } } }),
    prisma.order.findMany({
      select: {
        totalCharged: true,
        deliveryCost: true,
        driverCost: true,
        estimatedProfit: true,
        paymentStatus: true,
        currentStageKey: true,
      },
    }),
  ]);

  const activeDeliveries = orders.filter(
    (o) => !["DELIVERED", "CANCELLED", "RETURNED_TO_SENDER"].includes(o.currentStageKey)
  ).length;

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalCharged, 0);
  const deliveryCosts = orders.reduce((sum, o) => sum + o.deliveryCost + o.driverCost, 0);
  const estimatedProfit = orders.reduce((sum, o) => sum + o.estimatedProfit, 0);
  const outstandingPayments = orders
    .filter((o) => o.paymentStatus === "UNPAID" || o.paymentStatus === "PARTIAL")
    .reduce((sum, o) => sum + o.totalCharged, 0);

  return {
    totalOrders,
    activeDeliveries,
    deliveredToday,
    delayedCount,
    totalRevenue,
    deliveryCosts,
    estimatedProfit,
    outstandingPayments,
  };
}

export async function getOrdersPerDay(days = 14) {
  const since = subDays(startOfDay(new Date()), days - 1);
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true, totalCharged: true },
  });

  const buckets = new Map<string, { date: string; orders: number; revenue: number }>();
  for (let i = 0; i < days; i++) {
    const d = subDays(new Date(), days - 1 - i);
    const key = format(d, "MMM d");
    buckets.set(key, { date: key, orders: 0, revenue: 0 });
  }
  for (const o of orders) {
    const key = format(o.createdAt, "MMM d");
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.orders += 1;
      bucket.revenue += o.totalCharged;
    }
  }
  return Array.from(buckets.values());
}

export async function getStatusBreakdown() {
  const orders = await prisma.order.findMany({ select: { currentStageKey: true } });
  const total = orders.length || 1;

  const groups: Record<string, number> = {
    "In Transit": 0,
    "Out for Delivery": 0,
    Delivered: 0,
    Delayed: 0,
    Cancelled: 0,
    Other: 0,
  };

  for (const o of orders) {
    const key = o.currentStageKey;
    if (["PICKED_UP", "AT_SORTING_FACILITY", "IN_TRANSIT", "ARRIVED_AT_LOCAL_FACILITY"].includes(key)) groups["In Transit"]++;
    else if (key === "OUT_FOR_DELIVERY") groups["Out for Delivery"]++;
    else if (key === "DELIVERED") groups["Delivered"]++;
    else if (["DELIVERY_DELAYED", "ADDRESS_ISSUE", "CUSTOMER_UNAVAILABLE", "DELIVERY_ATTEMPTED"].includes(key)) groups["Delayed"]++;
    else if (["CANCELLED", "RETURNED_TO_SENDER"].includes(key)) groups["Cancelled"]++;
    else groups["Other"]++;
  }

  return Object.entries(groups)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value, pct: Math.round((value / total) * 100) }));
}

export async function getDeliveryPerformance() {
  const delivered = await prisma.order.findMany({
    where: { currentStageKey: "DELIVERED" },
    select: { createdAt: true, actualDeliveryDate: true, estimatedDeliveryDate: true },
  });

  const failedStages = ["RETURNED_TO_SENDER", "CANCELLED"];
  const [failedCount, totalNonCreated] = await Promise.all([
    prisma.order.count({ where: { currentStageKey: { in: failedStages } } }),
    prisma.order.count(),
  ]);

  let totalDeliveryHours = 0;
  let onTimeCount = 0;
  for (const o of delivered) {
    if (o.actualDeliveryDate) {
      totalDeliveryHours += (o.actualDeliveryDate.getTime() - o.createdAt.getTime()) / 3_600_000;
      if (o.estimatedDeliveryDate && o.actualDeliveryDate <= o.estimatedDeliveryDate) onTimeCount++;
    }
  }

  const avgDeliveryHours = delivered.length ? totalDeliveryHours / delivered.length : 0;
  const onTimePct = delivered.length ? Math.round((onTimeCount / delivered.length) * 100) : 0;
  const failedPct = totalNonCreated ? Math.round((failedCount / totalNonCreated) * 100) : 0;

  return { avgDeliveryHours, onTimePct, failedPct, deliveredCount: delivered.length };
}

export async function getSalesAnalytics(days = 30) {
  const since = subDays(startOfDay(new Date()), days - 1);
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true, totalCharged: true },
  });

  const halfway = subDays(new Date(), Math.floor(days / 2));
  const firstHalf = orders.filter((o) => o.createdAt < halfway);
  const secondHalf = orders.filter((o) => o.createdAt >= halfway);
  const firstRevenue = firstHalf.reduce((s, o) => s + o.totalCharged, 0);
  const secondRevenue = secondHalf.reduce((s, o) => s + o.totalCharged, 0);
  const revenueGrowthPct = firstRevenue > 0 ? Math.round(((secondRevenue - firstRevenue) / firstRevenue) * 100) : secondRevenue > 0 ? 100 : 0;

  const totalRevenue = orders.reduce((s, o) => s + o.totalCharged, 0);
  const avgOrderValue = orders.length ? totalRevenue / orders.length : 0;

  return {
    ordersInPeriod: orders.length,
    ordersPerDay: orders.length / days,
    totalRevenue,
    avgOrderValue,
    revenueGrowthPct,
  };
}

export async function getCustomerAnalytics(days = 30) {
  const since = subDays(startOfDay(new Date()), days - 1);

  const [newCustomers, allCustomers] = await Promise.all([
    prisma.customer.count({ where: { createdAt: { gte: since } } }),
    prisma.customer.findMany({
      include: { orders: { select: { totalCharged: true, createdAt: true } } },
    }),
  ]);

  const repeatCustomers = allCustomers.filter((c) => c.orders.length > 1).length;

  const topCustomers = allCustomers
    .map((c) => ({
      id: c.id,
      name: c.name,
      orders: c.orders.length,
      totalSpent: c.orders.reduce((s, o) => s + o.totalCharged, 0),
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);

  const totalSpentAll = allCustomers.reduce((s, c) => s + c.orders.reduce((x, o) => x + o.totalCharged, 0), 0);
  const clv = allCustomers.length ? totalSpentAll / allCustomers.length : 0;

  return { newCustomers, repeatCustomers, topCustomers, clv, totalCustomers: allCustomers.length };
}

export async function getProfitabilityAnalytics() {
  const orders = await prisma.order.findMany({
    include: { customer: true, service: true },
  });

  const byCustomer = new Map<string, { name: string; profit: number; orders: number }>();
  const byService = new Map<string, { name: string; profit: number; orders: number }>();
  const byRoute = new Map<string, { route: string; profit: number; orders: number }>();

  for (const o of orders) {
    const c = byCustomer.get(o.customerId) ?? { name: o.customer.name, profit: 0, orders: 0 };
    c.profit += o.estimatedProfit;
    c.orders += 1;
    byCustomer.set(o.customerId, c);

    const s = byService.get(o.serviceId) ?? { name: o.service.name, profit: 0, orders: 0 };
    s.profit += o.estimatedProfit;
    s.orders += 1;
    byService.set(o.serviceId, s);

    const routeKey = `${o.pickupCity} → ${o.deliveryCity}`;
    const r = byRoute.get(routeKey) ?? { route: routeKey, profit: 0, orders: 0 };
    r.profit += o.estimatedProfit;
    r.orders += 1;
    byRoute.set(routeKey, r);
  }

  const avgProfitPerOrder = orders.length ? orders.reduce((s, o) => s + o.estimatedProfit, 0) / orders.length : 0;

  return {
    topCustomers: Array.from(byCustomer.values()).sort((a, b) => b.profit - a.profit).slice(0, 5),
    topServices: Array.from(byService.values()).sort((a, b) => b.profit - a.profit),
    topRoutes: Array.from(byRoute.values()).sort((a, b) => b.profit - a.profit).slice(0, 5),
    avgProfitPerOrder,
  };
}
