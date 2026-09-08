"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole, requireSession } from "@/lib/permissions";
import { generateOrderNumber, generateTrackingToken } from "@/lib/order-number";
import { calcEstimatedProfit, calcTotalCharged } from "@/lib/finance";
import { logAudit } from "@/lib/audit";
import { createOrderSchema, updateStatusSchema, assignDriverSchema } from "@/lib/validation";
import { notifyOrderEvent } from "@/lib/notifications/dispatch";
import { round2 } from "@/lib/finance";

export interface ActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

class InsufficientStockError extends Error {}

/** Adds dispatched quantities back to Product stock for an order's packages. Idempotent per-order via Order.stockRestored. */
async function restockDispatchedPackages(tx: Prisma.TransactionClient, orderId: string) {
  const packages = await tx.package.findMany({ where: { orderId, productId: { not: null } } });
  for (const pkg of packages) {
    if (pkg.productId) {
      await tx.product.update({ where: { id: pkg.productId }, data: { currentStock: { increment: pkg.quantity } } });
    }
  }
  return packages.filter((p) => p.productId).map((p) => p.productId as string);
}

export async function createOrder(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole("ADMIN", "OPERATIONS");

  let packages: unknown[] = [];
  try {
    packages = JSON.parse((formData.get("packagesJson") as string) || "[]");
  } catch {
    return { error: "Invalid package data." };
  }

  const raw = {
    customerId: formData.get("customerId") || undefined,
    customerName: formData.get("customerName") || undefined,
    customerCompany: formData.get("customerCompany") || "",
    customerEmail: formData.get("customerEmail") || "",
    customerPhone: formData.get("customerPhone") || undefined,

    senderName: formData.get("senderName"),
    senderPhone: formData.get("senderPhone"),
    pickupAddress: formData.get("pickupAddress"),
    pickupCity: formData.get("pickupCity"),
    pickupPostcode: formData.get("pickupPostcode"),
    pickupCountry: formData.get("pickupCountry"),

    recipientName: formData.get("recipientName"),
    recipientPhone: formData.get("recipientPhone"),
    deliveryAddress: formData.get("deliveryAddress"),
    deliveryCity: formData.get("deliveryCity"),
    deliveryPostcode: formData.get("deliveryPostcode"),
    deliveryCountry: formData.get("deliveryCountry"),

    packages,

    serviceId: formData.get("serviceId"),
    priority: formData.get("priority") || "STANDARD",
    estimatedPickupDate: formData.get("estimatedPickupDate") || "",
    estimatedDeliveryDate: formData.get("estimatedDeliveryDate") || "",
    driverId: formData.get("driverId") || "",
    vehicleId: formData.get("vehicleId") || "",
    deliveryInstructions: formData.get("deliveryInstructions") || "",

    customerPrice: formData.get("customerPrice") || 0,
    deliveryCost: formData.get("deliveryCost") || 0,
    driverCost: formData.get("driverCost") || 0,
    additionalFees: formData.get("additionalFees") || 0,
    discount: formData.get("discount") || 0,
    tax: formData.get("tax") || 0,
    paymentStatus: formData.get("paymentStatus") || "UNPAID",
    paymentMethod: formData.get("paymentMethod") || "",
  };

  const parsed = createOrderSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path.join(".")] = issue.message;
    }
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }

  const data = parsed.data;

  if (!data.customerId && !data.customerName) {
    return { error: "Select an existing customer or enter a new customer name." };
  }

  const totalCharged = calcTotalCharged(data);

  let orderId = "";
  let orderNumber = "";
  let trackingToken = "";
  let dispatchedProducts: { productId: string; quantity: number; name: string }[] = [];

  try {
    await prisma.$transaction(async (tx) => {
      let customerId = data.customerId;
      if (!customerId) {
        const customer = await tx.customer.create({
          data: {
            name: data.customerName!,
            company: data.customerCompany || null,
            email: data.customerEmail || "",
            phone: data.customerPhone || "",
          },
        });
        customerId = customer.id;
      }

      // Snapshot cost-of-goods for any packages dispatched from vendor stock,
      // and validate there's enough on hand before committing to the order.
      const packagesWithCost: (typeof data.packages[number] & { unitCost: number; costOfGoods: number })[] = [];
      dispatchedProducts = [];
      for (const p of data.packages) {
        if (!p.productId) {
          packagesWithCost.push({ ...p, unitCost: 0, costOfGoods: 0 });
          continue;
        }
        const product = await tx.product.findUnique({ where: { id: p.productId } });
        if (!product || !product.active) {
          throw new InsufficientStockError("A selected product is no longer available.");
        }
        if (product.currentStock < p.quantity) {
          throw new InsufficientStockError(
            `Not enough stock for "${product.name}": requested ${p.quantity} ${product.unit}, only ${product.currentStock} ${product.unit} available.`
          );
        }
        const costOfGoods = round2(p.quantity * product.currentUnitCost);
        packagesWithCost.push({ ...p, unitCost: product.currentUnitCost, costOfGoods });
        dispatchedProducts.push({ productId: p.productId, quantity: p.quantity, name: product.name });
      }
      const costOfGoods = round2(packagesWithCost.reduce((sum, p) => sum + p.costOfGoods, 0));
      const estimatedProfit = calcEstimatedProfit({ ...data, costOfGoods });

      orderNumber = await generateOrderNumber(tx);
      trackingToken = generateTrackingToken();

      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: customerId!,
          senderName: data.senderName,
          senderPhone: data.senderPhone,
          pickupAddress: data.pickupAddress,
          pickupCity: data.pickupCity,
          pickupPostcode: data.pickupPostcode,
          pickupCountry: data.pickupCountry,
          recipientName: data.recipientName,
          recipientPhone: data.recipientPhone,
          deliveryAddress: data.deliveryAddress,
          deliveryCity: data.deliveryCity,
          deliveryPostcode: data.deliveryPostcode,
          deliveryCountry: data.deliveryCountry,
          serviceId: data.serviceId,
          priority: data.priority,
          estimatedPickupDate: data.estimatedPickupDate ? new Date(data.estimatedPickupDate) : null,
          estimatedDeliveryDate: data.estimatedDeliveryDate ? new Date(data.estimatedDeliveryDate) : null,
          driverId: data.driverId || null,
          vehicleId: data.vehicleId || null,
          deliveryInstructions: data.deliveryInstructions || null,
          currentStageKey: "ORDER_CREATED",
          customerPrice: data.customerPrice,
          deliveryCost: data.deliveryCost,
          driverCost: data.driverCost,
          additionalFees: data.additionalFees,
          discount: data.discount,
          tax: data.tax,
          totalCharged,
          costOfGoods,
          estimatedProfit,
          paymentStatus: data.paymentStatus,
          paymentMethod: data.paymentMethod || null,
          createdById: session.user.id,
          packages: {
            create: packagesWithCost.map((p) => ({
              description: p.description,
              packageType: p.packageType,
              quantity: p.quantity,
              weightKg: p.weightKg,
              lengthCm: p.lengthCm ?? null,
              widthCm: p.widthCm ?? null,
              heightCm: p.heightCm ?? null,
              specialHandling: p.specialHandling || null,
              productId: p.productId || null,
              unitCost: p.unitCost,
              costOfGoods: p.costOfGoods,
            })),
          },
          statusEvents: {
            create: {
              previousStageKey: null,
              newStageKey: "ORDER_CREATED",
              changedById: session.user.id,
              changedByRole: session.user.role,
              note: "Order created",
            },
          },
          trackingToken: { create: { token: trackingToken } },
        },
      });

      if (data.paymentStatus !== "UNPAID") {
        await tx.payment.create({
          data: {
            orderId: order.id,
            amount: totalCharged,
            method: data.paymentMethod || "CARD",
            status: data.paymentStatus,
            paidAt: data.paymentStatus === "PAID" ? new Date() : null,
          },
        });
      }

      if (data.deliveryCost > 0) {
        await tx.expense.create({
          data: { orderId: order.id, category: "DELIVERY", amount: data.deliveryCost, createdById: session.user.id },
        });
      }
      if (data.driverCost > 0) {
        await tx.expense.create({
          data: { orderId: order.id, category: "DRIVER", amount: data.driverCost, createdById: session.user.id },
        });
      }
      if (costOfGoods > 0) {
        await tx.expense.create({
          data: { orderId: order.id, category: "COST_OF_GOODS", amount: costOfGoods, description: "Vendor stock dispatched", createdById: session.user.id },
        });
      }

      for (const dp of dispatchedProducts) {
        await tx.product.update({
          where: { id: dp.productId },
          data: { currentStock: { decrement: dp.quantity } },
        });
      }

      orderId = order.id;
    }, { timeout: 15000 });
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return { error: err.message };
    }
    throw err;
  }

  await logAudit({
    userId: session.user.id,
    action: "ORDER_CREATED",
    entityType: "Order",
    entityId: orderId,
    details: `Created order ${orderNumber}`,
  });
  for (const dp of dispatchedProducts) {
    await logAudit({
      userId: session.user.id,
      action: "STOCK_DISPATCHED",
      entityType: "Product",
      entityId: dp.productId,
      details: `-${dp.quantity} dispatched to order ${orderNumber}`,
    });
  }

  await notifyOrderEvent(orderId, "ORDER_CREATED").catch(() => {});

  revalidatePath("/orders");
  revalidatePath("/dashboard");
  if (dispatchedProducts.length > 0) {
    revalidatePath("/vendors");
    revalidatePath("/vendors/products");
    for (const dp of dispatchedProducts) revalidatePath(`/vendors/products/${dp.productId}`);
  }
  redirect(`/orders/${orderId}?created=1`);
}

export async function updateOrderStatus(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole("ADMIN", "OPERATIONS", "DRIVER");

  const parsed = updateStatusSchema.safeParse({
    orderId: formData.get("orderId"),
    newStageKey: formData.get("newStageKey"),
    location: formData.get("location") || "",
    note: formData.get("note") || "",
  });
  if (!parsed.success) return { error: "Invalid status update." };
  const { orderId, newStageKey, location, note } = parsed.data;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Order not found." };

  if (session.user.role === "DRIVER") {
    const driver = await prisma.driver.findUnique({ where: { userId: session.user.id } });
    if (!driver || order.driverId !== driver.id) {
      return { error: "You can only update deliveries assigned to you." };
    }
  }

  const stage = await prisma.deliveryStage.findUnique({ where: { key: newStageKey } });
  if (!stage) return { error: "Unknown delivery stage." };

  const shouldRestock = stage.isTerminalFailure && !order.stockRestored;
  let restockedProductIds: string[] = [];

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        currentStageKey: newStageKey,
        actualPickupDate: newStageKey === "PICKED_UP" ? new Date() : undefined,
        actualDeliveryDate: stage.isTerminalSuccess ? new Date() : undefined,
        ...(shouldRestock ? { stockRestored: true } : {}),
      },
    });
    await tx.orderStatusEvent.create({
      data: {
        orderId,
        previousStageKey: order.currentStageKey,
        newStageKey,
        changedById: session.user.id,
        changedByRole: session.user.role,
        location: location || null,
        note: note || null,
      },
    });
    if (shouldRestock) {
      restockedProductIds = await restockDispatchedPackages(tx, orderId);
    }
  });

  await logAudit({
    userId: session.user.id,
    action: "STATUS_UPDATED",
    entityType: "Order",
    entityId: orderId,
    details: `${order.currentStageKey} -> ${newStageKey}`,
  });
  if (restockedProductIds.length > 0) {
    await logAudit({
      userId: session.user.id,
      action: "STOCK_RESTORED",
      entityType: "Order",
      entityId: orderId,
      details: `Restocked vendor products after order moved to ${newStageKey}`,
    });
  }

  await notifyOrderEvent(orderId, newStageKey).catch(() => {});

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath("/driver");
  if (restockedProductIds.length > 0) {
    revalidatePath("/vendors");
    revalidatePath("/vendors/products");
    for (const id of restockedProductIds) revalidatePath(`/vendors/products/${id}`);
  }
  return {};
}

export async function assignDriver(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole("ADMIN", "OPERATIONS");

  const parsed = assignDriverSchema.safeParse({
    orderId: formData.get("orderId"),
    driverId: formData.get("driverId"),
    vehicleId: formData.get("vehicleId") || "",
  });
  if (!parsed.success) return { error: "Please select a driver." };

  const { orderId, driverId, vehicleId } = parsed.data;

  const driver = await prisma.driver.findUnique({ where: { id: driverId } });
  if (!driver) return { error: "Driver not found." };

  await prisma.order.update({
    where: { id: orderId },
    data: { driverId, vehicleId: vehicleId || driver.vehicleId || null },
  });

  await logAudit({
    userId: session.user.id,
    action: "DRIVER_ASSIGNED",
    entityType: "Order",
    entityId: orderId,
    details: `Assigned driver ${driver.name}`,
  });

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  return {};
}

export async function cancelOrder(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole("ADMIN", "OPERATIONS");
  const orderId = formData.get("orderId") as string;
  const reason = (formData.get("reason") as string) || "Cancelled by staff";

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Order not found." };

  const shouldRestock = !order.stockRestored;
  let restockedProductIds: string[] = [];

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        currentStageKey: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: reason,
        ...(shouldRestock ? { stockRestored: true } : {}),
      },
    });
    await tx.orderStatusEvent.create({
      data: {
        orderId,
        previousStageKey: order.currentStageKey,
        newStageKey: "CANCELLED",
        changedById: session.user.id,
        changedByRole: session.user.role,
        note: reason,
      },
    });
    if (shouldRestock) {
      restockedProductIds = await restockDispatchedPackages(tx, orderId);
    }
  });

  await logAudit({ userId: session.user.id, action: "ORDER_CANCELLED", entityType: "Order", entityId: orderId, details: reason });
  if (restockedProductIds.length > 0) {
    await logAudit({
      userId: session.user.id,
      action: "STOCK_RESTORED",
      entityType: "Order",
      entityId: orderId,
      details: "Restocked vendor products after order cancellation",
    });
  }

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  if (restockedProductIds.length > 0) {
    revalidatePath("/vendors");
    revalidatePath("/vendors/products");
    for (const id of restockedProductIds) revalidatePath(`/vendors/products/${id}`);
  }
  return {};
}

export async function deleteOrder(formData: FormData): Promise<void> {
  const session = await requireRole("ADMIN");
  const orderId = formData.get("orderId") as string;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) redirect("/orders");

  const shouldRestock = !order.stockRestored;
  let restockedProductIds: string[] = [];

  await prisma.$transaction(async (tx) => {
    if (shouldRestock) {
      restockedProductIds = await restockDispatchedPackages(tx, orderId);
    }
    await tx.order.delete({ where: { id: orderId } });
  });

  await logAudit({
    userId: session.user.id,
    action: "ORDER_DELETED",
    entityType: "Order",
    entityId: orderId,
    details: `Deleted order ${order?.orderNumber}`,
  });

  revalidatePath("/orders");
  if (restockedProductIds.length > 0) {
    revalidatePath("/vendors");
    revalidatePath("/vendors/products");
    for (const id of restockedProductIds) revalidatePath(`/vendors/products/${id}`);
  }
  redirect("/orders");
}

export async function addDeliveryNote(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireSession();
  const orderId = formData.get("orderId") as string;
  const note = (formData.get("note") as string)?.trim();
  if (!note) return { error: "Note cannot be empty." };

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Order not found." };

  await prisma.orderStatusEvent.create({
    data: {
      orderId,
      previousStageKey: order.currentStageKey,
      newStageKey: order.currentStageKey,
      changedById: session.user.id,
      changedByRole: session.user.role,
      note,
    },
  });

  revalidatePath(`/orders/${orderId}`);
  revalidatePath(`/driver/${orderId}`);
  return {};
}
