"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { driverSchema, vehicleSchema } from "@/lib/validation";
import { hashPassword } from "@/lib/password";
import { logAudit } from "@/lib/audit";
export type { ActionState } from "@/lib/actions/orders";
import type { ActionState } from "@/lib/actions/orders";

function generateDriverCode(seq: number) {
  return `DRV-${String(seq).padStart(3, "0")}`;
}

export async function createDriver(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole("ADMIN");

  const parsed = driverSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    vehicleId: formData.get("vehicleId") || "",
    status: formData.get("status") || "ACTIVE",
    createLogin: formData.get("createLogin") === "on",
    password: formData.get("password") || "",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] = issue.message;
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }
  const data = parsed.data;

  const count = await prisma.driver.count();
  const driverCode = generateDriverCode(count + 1);

  let userId: string | undefined;
  if (data.createLogin) {
    if (!data.password || data.password.length < 8) {
      return { error: "A password of at least 8 characters is required to create a driver login." };
    }
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return { error: "A user with this email already exists." };
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, passwordHash: await hashPassword(data.password), role: "DRIVER" },
    });
    userId = user.id;
  }

  const driver = await prisma.driver.create({
    data: {
      driverCode,
      name: data.name,
      phone: data.phone,
      email: data.email,
      status: data.status,
      vehicleId: data.vehicleId || null,
      userId,
    },
  });

  await logAudit({ userId: session.user.id, action: "DRIVER_CREATED", entityType: "Driver", entityId: driver.id });

  revalidatePath("/drivers");
  return {};
}

export async function updateDriverStatus(formData: FormData): Promise<void> {
  const session = await requireRole("ADMIN", "OPERATIONS");
  const id = formData.get("id") as string;
  const status = formData.get("status") as string;

  await prisma.driver.update({ where: { id }, data: { status } });
  await logAudit({ userId: session.user.id, action: "DRIVER_STATUS_UPDATED", entityType: "Driver", entityId: id, details: status });

  revalidatePath("/drivers");
  revalidatePath(`/drivers/${id}`);
}

export async function createVehicle(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole("ADMIN");

  const parsed = vehicleSchema.safeParse({
    type: formData.get("type"),
    registration: formData.get("registration"),
    capacityKg: formData.get("capacityKg") || undefined,
    status: formData.get("status") || "ACTIVE",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] = issue.message;
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }

  try {
    const vehicle = await prisma.vehicle.create({ data: parsed.data });
    await logAudit({ userId: session.user.id, action: "VEHICLE_CREATED", entityType: "Vehicle", entityId: vehicle.id });
  } catch {
    return { error: "A vehicle with this registration already exists." };
  }

  revalidatePath("/vehicles");
  return {};
}
