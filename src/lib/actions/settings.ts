"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { hashPassword } from "@/lib/password";
import { companySettingsSchema, serviceSchema, userSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";
export type { ActionState } from "@/lib/actions/orders";
import type { ActionState } from "@/lib/actions/orders";

export async function updateCompanySettings(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole("ADMIN");

  const parsed = companySettingsSchema.safeParse({
    name: formData.get("name"),
    logoUrl: formData.get("logoUrl") || "",
    address: formData.get("address") || "",
    phone: formData.get("phone") || "",
    email: formData.get("email") || "",
    website: formData.get("website") || "",
    countryCode: formData.get("countryCode"),
    currency: formData.get("currency"),
  });
  if (!parsed.success) return { error: "Please fix the highlighted fields." };

  await prisma.companySettings.upsert({
    where: { id: "singleton" },
    update: parsed.data,
    create: { id: "singleton", ...parsed.data },
  });

  await logAudit({ userId: session.user.id, action: "SETTINGS_UPDATED", entityType: "CompanySettings" });
  // Currency/country affect nearly every page (dashboard, orders, finance,
  // analytics, forms) since they all format money or default address fields.
  revalidatePath("/", "layout");
  return {};
}

export async function createService(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole("ADMIN");

  const parsed = serviceSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || "",
    basePrice: formData.get("basePrice"),
    active: true,
  });
  if (!parsed.success) return { error: "Please fix the highlighted fields." };

  try {
    await prisma.service.create({ data: { ...parsed.data, sortOrder: 999 } });
  } catch {
    return { error: "A service with this name already exists." };
  }

  await logAudit({ userId: session.user.id, action: "SERVICE_CREATED", entityType: "Service" });
  revalidatePath("/settings");
  return {};
}

export async function toggleServiceActive(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = formData.get("id") as string;
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) return;
  await prisma.service.update({ where: { id }, data: { active: !service.active } });
  revalidatePath("/settings");
}

export async function createUser(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole("ADMIN");

  const parsed = userSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    financeAccess: formData.get("financeAccess") === "on",
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] = issue.message;
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }
  const data = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return { error: "A user with this email already exists." };

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
      financeAccess: data.role === "ADMIN" ? true : !!data.financeAccess,
      passwordHash: await hashPassword(data.password),
    },
  });

  await logAudit({ userId: session.user.id, action: "USER_CREATED", entityType: "User", entityId: user.id, details: data.email });
  revalidatePath("/settings");
  return {};
}

export async function toggleUserActive(formData: FormData): Promise<void> {
  const session = await requireRole("ADMIN");
  const id = formData.get("id") as string;
  if (id === session.user.id) return;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return;
  await prisma.user.update({ where: { id }, data: { active: !user.active } });
  await logAudit({ userId: session.user.id, action: "USER_STATUS_TOGGLED", entityType: "User", entityId: id });
  revalidatePath("/settings");
}

export async function updateNotificationSetting(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = formData.get("id") as string;
  const channel = formData.get("channel") as "emailEnabled" | "smsEnabled" | "whatsappEnabled";
  const setting = await prisma.notificationSetting.findUnique({ where: { id } });
  if (!setting) return;
  await prisma.notificationSetting.update({ where: { id }, data: { [channel]: !setting[channel] } });
  revalidatePath("/settings");
}

export async function updateStageConfig(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = formData.get("id") as string;
  const label = formData.get("label") as string;
  const color = formData.get("color") as string;
  if (!label) return;
  await prisma.deliveryStage.update({ where: { id }, data: { label, color } });
  revalidatePath("/settings");
}
