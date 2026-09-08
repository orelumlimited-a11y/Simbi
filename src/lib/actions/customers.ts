"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { customerSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";
export type { ActionState } from "@/lib/actions/orders";
import type { ActionState } from "@/lib/actions/orders";

export async function createCustomer(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole("ADMIN", "OPERATIONS");

  const parsed = customerSchema.safeParse({
    name: formData.get("name"),
    company: formData.get("company") || "",
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address") || "",
    city: formData.get("city") || "",
    postcode: formData.get("postcode") || "",
    country: formData.get("country") || "",
    emailOptIn: formData.get("emailOptIn") === "true",
    smsOptIn: formData.get("smsOptIn") === "true",
    whatsappOptIn: formData.get("whatsappOptIn") === "true",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] = issue.message;
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }

  const customer = await prisma.customer.create({ data: parsed.data });

  await logAudit({ userId: session.user.id, action: "CUSTOMER_CREATED", entityType: "Customer", entityId: customer.id });

  revalidatePath("/customers");
  return {};
}

export async function updateCustomer(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole("ADMIN", "OPERATIONS");
  const id = formData.get("id") as string;

  const parsed = customerSchema.safeParse({
    name: formData.get("name"),
    company: formData.get("company") || "",
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address") || "",
    city: formData.get("city") || "",
    postcode: formData.get("postcode") || "",
    country: formData.get("country") || "",
    emailOptIn: formData.get("emailOptIn") === "true",
    smsOptIn: formData.get("smsOptIn") === "true",
    whatsappOptIn: formData.get("whatsappOptIn") === "true",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] = issue.message;
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }

  await prisma.customer.update({ where: { id }, data: parsed.data });
  await logAudit({ userId: session.user.id, action: "CUSTOMER_UPDATED", entityType: "Customer", entityId: id });

  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  return {};
}

const CHANNEL_FIELDS = { EMAIL: "emailOptIn", SMS: "smsOptIn", WHATSAPP: "whatsappOptIn" } as const;

/** One-click toggle for a single contact-preference channel from the customer detail page. */
export async function toggleCustomerChannel(formData: FormData): Promise<void> {
  const session = await requireRole("ADMIN", "OPERATIONS");
  const id = formData.get("id") as string;
  const channel = formData.get("channel") as keyof typeof CHANNEL_FIELDS;
  const field = CHANNEL_FIELDS[channel];
  if (!field) return;

  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) return;

  await prisma.customer.update({ where: { id }, data: { [field]: !customer[field] } });
  await logAudit({
    userId: session.user.id,
    action: "CUSTOMER_CONTACT_PREF_UPDATED",
    entityType: "Customer",
    entityId: id,
    details: `${channel} -> ${!customer[field]}`,
  });

  revalidatePath(`/customers/${id}`);
}
