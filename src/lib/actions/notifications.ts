"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { resendNotification as resendNotificationDispatch, sendManualNotification } from "@/lib/notifications/dispatch";
import { logAudit } from "@/lib/audit";
import type { NotificationChannel } from "@/lib/notifications/types";
export type { ActionState } from "@/lib/actions/orders";
import type { ActionState } from "@/lib/actions/orders";

export async function resendNotification(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole("ADMIN", "OPERATIONS");
  const notificationId = formData.get("notificationId") as string;
  const orderId = formData.get("orderId") as string;

  const result = await resendNotificationDispatch(notificationId);
  if (!result.ok) return { error: result.error };

  await logAudit({ userId: session.user.id, action: "NOTIFICATION_RESENT", entityType: "Notification", entityId: notificationId });

  revalidatePath(`/orders/${orderId}`);
  return {};
}

export async function manualNotify(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole("ADMIN", "OPERATIONS");
  const orderId = formData.get("orderId") as string;
  const channel = formData.get("channel") as NotificationChannel;
  const eventKey = formData.get("eventKey") as string;

  if (!orderId || !channel || !eventKey) return { error: "Missing required fields." };

  const result = await sendManualNotification(orderId, channel, eventKey);
  if (!result.ok) return { error: result.error };

  await logAudit({
    userId: session.user.id,
    action: "NOTIFICATION_MANUAL_SEND",
    entityType: "Order",
    entityId: orderId,
    details: `${channel} / ${eventKey}`,
  });

  revalidatePath(`/orders/${orderId}`);
  return {};
}
