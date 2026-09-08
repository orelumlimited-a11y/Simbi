"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { vendorSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";
export type { ActionState } from "@/lib/actions/orders";
import type { ActionState } from "@/lib/actions/orders";

export async function createVendor(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole("ADMIN", "OPERATIONS");

  const parsed = vendorSchema.safeParse({
    name: formData.get("name"),
    contactName: formData.get("contactName") || "",
    email: formData.get("email") || "",
    phone: formData.get("phone") || "",
    address: formData.get("address") || "",
    city: formData.get("city") || "",
    country: formData.get("country") || "",
    notes: formData.get("notes") || "",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] = issue.message;
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }

  const vendor = await prisma.vendor.create({ data: parsed.data });
  await logAudit({ userId: session.user.id, action: "VENDOR_CREATED", entityType: "Vendor", entityId: vendor.id });

  revalidatePath("/vendors");
  return {};
}

export async function toggleVendorActive(formData: FormData): Promise<void> {
  const session = await requireRole("ADMIN", "OPERATIONS");
  const id = formData.get("id") as string;

  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor) return;

  await prisma.vendor.update({ where: { id }, data: { active: !vendor.active } });
  await logAudit({ userId: session.user.id, action: "VENDOR_STATUS_TOGGLED", entityType: "Vendor", entityId: id });

  revalidatePath("/vendors");
  revalidatePath(`/vendors/${id}`);
}
