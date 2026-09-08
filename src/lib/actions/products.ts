"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { productSchema, stockReceiptSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";
export type { ActionState } from "@/lib/actions/orders";
import type { ActionState } from "@/lib/actions/orders";

export async function createProduct(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole("ADMIN", "OPERATIONS");

  const parsed = productSchema.safeParse({
    sku: formData.get("sku") || "",
    name: formData.get("name"),
    description: formData.get("description") || "",
    unit: formData.get("unit") || "pcs",
    reorderLevel: formData.get("reorderLevel") || 0,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] = issue.message;
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }

  const data = parsed.data;
  try {
    const product = await prisma.product.create({
      data: { ...data, sku: data.sku || null },
    });
    await logAudit({ userId: session.user.id, action: "PRODUCT_CREATED", entityType: "Product", entityId: product.id });
  } catch {
    return { error: "A product with this SKU already exists." };
  }

  revalidatePath("/vendors/products");
  return {};
}

export async function toggleProductActive(formData: FormData): Promise<void> {
  const session = await requireRole("ADMIN", "OPERATIONS");
  const id = formData.get("id") as string;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return;

  await prisma.product.update({ where: { id }, data: { active: !product.active } });
  await logAudit({ userId: session.user.id, action: "PRODUCT_STATUS_TOGGLED", entityType: "Product", entityId: id });

  revalidatePath("/vendors/products");
  revalidatePath(`/vendors/products/${id}`);
}

export async function createStockReceipt(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole("ADMIN", "OPERATIONS");

  const parsed = stockReceiptSchema.safeParse({
    productId: formData.get("productId") || "",
    newProductName: formData.get("newProductName") || "",
    newProductUnit: formData.get("newProductUnit") || "",
    vendorId: formData.get("vendorId"),
    quantity: formData.get("quantity"),
    unitCost: formData.get("unitCost") || 0,
    receivedAt: formData.get("receivedAt") || "",
    note: formData.get("note") || "",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] = issue.message;
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }
  const data = parsed.data;
  const totalCost = Math.round(data.quantity * data.unitCost * 100) / 100;
  const isNewProduct = !data.productId || data.productId === "__new__";

  const vendor = await prisma.vendor.findUnique({ where: { id: data.vendorId } });
  if (!vendor) return { error: "Vendor not found." };
  if (!isNewProduct) {
    const existing = await prisma.product.findUnique({ where: { id: data.productId } });
    if (!existing) return { error: "Product not found." };
  }

  let result;
  try {
    result = await prisma.$transaction(async (tx) => {
      const product = isNewProduct
        ? await tx.product.create({
            data: {
              name: data.newProductName!.trim(),
              unit: data.newProductUnit?.trim() || "pcs",
            },
          })
        : await tx.product.findUniqueOrThrow({ where: { id: data.productId } });

      const created = await tx.stockReceipt.create({
        data: {
          productId: product.id,
          vendorId: data.vendorId,
          quantity: data.quantity,
          unitCost: data.unitCost,
          totalCost,
          receivedAt: data.receivedAt ? new Date(data.receivedAt) : new Date(),
          note: data.note || null,
          receivedById: session.user.id,
        },
      });

      await tx.product.update({
        where: { id: product.id },
        data: {
          currentStock: { increment: data.quantity },
          ...(data.unitCost > 0 ? { currentUnitCost: data.unitCost } : {}),
        },
      });

      return { receipt: created, product };
    });
  } catch {
    return { error: "A product with this name already exists." };
  }

  await logAudit({
    userId: session.user.id,
    action: "STOCK_RECEIVED",
    entityType: "StockReceipt",
    entityId: result.receipt.id,
    details: `+${data.quantity} ${result.product.unit} of ${result.product.name} from ${vendor.name}`,
  });
  if (isNewProduct) {
    await logAudit({ userId: session.user.id, action: "PRODUCT_CREATED", entityType: "Product", entityId: result.product.id });
  }

  revalidatePath("/vendors");
  revalidatePath("/vendors/products");
  revalidatePath(`/vendors/products/${result.product.id}`);
  revalidatePath(`/vendors/${data.vendorId}`);
  return {};
}
