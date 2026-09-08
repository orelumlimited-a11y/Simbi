import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/notifications/providers/email";
import { sendSms } from "@/lib/notifications/providers/sms";
import { sendWhatsapp } from "@/lib/notifications/providers/whatsapp";
import { buildEmailMessage, buildShortMessage } from "@/lib/notifications/messages";
import type { NotificationChannel } from "@/lib/notifications/types";

interface MessageContext {
  orderNumber: string;
  recipientName: string;
  deliveryCity: string;
  estimatedDeliveryDate: Date | null;
  trackingUrl: string;
  companyName: string;
}

async function buildContext(order: {
  orderNumber: string;
  recipientName: string;
  deliveryCity: string;
  estimatedDeliveryDate: Date | null;
  trackingToken: { token: string } | null;
}): Promise<MessageContext | null> {
  if (!order.trackingToken) return null;
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const company = await prisma.companySettings.findUnique({ where: { id: "singleton" } });
  return {
    orderNumber: order.orderNumber,
    recipientName: order.recipientName,
    deliveryCity: order.deliveryCity,
    estimatedDeliveryDate: order.estimatedDeliveryDate,
    trackingUrl: `${baseUrl}/track/${order.trackingToken.token}`,
    companyName: company?.name ?? "Simbi Logistics",
  };
}

/** Sends one message on one channel and records the attempt (success or failure) on the Notification model. */
async function sendAndRecord(orderId: string, eventKey: string, channel: NotificationChannel, recipient: string, ctx: MessageContext) {
  let messageBody: string;
  let result;

  if (channel === "EMAIL") {
    const { subject, text } = buildEmailMessage(eventKey, ctx);
    messageBody = `${subject}\n\n${text}`;
    result = await sendEmail({ to: recipient, subject, text });
  } else {
    messageBody = buildShortMessage(eventKey, ctx);
    result = channel === "SMS" ? await sendSms({ to: recipient, body: messageBody }) : await sendWhatsapp({ to: recipient, body: messageBody });
  }

  await prisma.notification.create({
    data: {
      orderId,
      eventKey,
      channel,
      recipient,
      status: result.ok ? "SENT" : "FAILED",
      sentAt: result.ok ? new Date() : null,
      payload: result.ok ? messageBody : `ERROR: ${result.error ?? "Unknown error"}\n\n${messageBody}`,
    },
  });
}

/**
 * Sends (or attempts to send) a delivery-update notification for an order
 * event across every channel the customer has opted into, provided the
 * event itself hasn't been disabled company-wide in Settings. Called
 * automatically on order creation and every status change.
 *
 * Every attempt — success or failure — is recorded on the Notification
 * model so staff can see delivery history and diagnose problems (e.g. "not
 * configured") without digging through server logs.
 */
export async function notifyOrderEvent(orderId: string, eventKey: string): Promise<void> {
  const [order, eventSetting] = await Promise.all([
    prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true, trackingToken: true },
    }),
    prisma.notificationSetting.findUnique({ where: { eventKey } }),
  ]);
  if (!order) return;

  // Only the curated set of customer-facing events (seeded into
  // NotificationSetting — see src/lib/constants.ts NOTIFICATION_EVENTS) ever
  // trigger a notification. Internal-only stage changes (e.g. "Awaiting
  // Pickup", "Cancelled") have no settings row and are silently skipped, as
  // is any event a company-wide toggle in Settings has fully disabled.
  if (!eventSetting || (!eventSetting.emailEnabled && !eventSetting.smsEnabled && !eventSetting.whatsappEnabled)) {
    return;
  }

  const ctx = await buildContext(order);
  if (!ctx) return;

  const attempts: { channel: NotificationChannel; recipient: string | null; eligible: boolean }[] = [
    { channel: "EMAIL", recipient: order.customer.email || null, eligible: order.customer.emailOptIn && eventSetting.emailEnabled },
    { channel: "SMS", recipient: order.customer.phone || null, eligible: order.customer.smsOptIn && eventSetting.smsEnabled },
    { channel: "WHATSAPP", recipient: order.customer.phone || null, eligible: order.customer.whatsappOptIn && eventSetting.whatsappEnabled },
  ];

  for (const attempt of attempts) {
    if (!attempt.eligible || !attempt.recipient) continue;
    await sendAndRecord(orderId, eventKey, attempt.channel, attempt.recipient, ctx);
  }
}

/**
 * Manually send a notification on a specific channel for a specific order,
 * triggered explicitly by staff (e.g. via a "Notify Customer" button).
 * Bypasses the customer opt-in and company event toggles — those govern
 * *automatic* sends only; a human deliberately choosing to notify a
 * customer is a different, explicit action.
 */
export async function sendManualNotification(orderId: string, channel: NotificationChannel, eventKey: string): Promise<{ ok: boolean; error?: string }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: true, trackingToken: true },
  });
  if (!order) return { ok: false, error: "Order not found." };

  const recipient = channel === "EMAIL" ? order.customer.email : order.customer.phone;
  if (!recipient) return { ok: false, error: `Customer has no ${channel === "EMAIL" ? "email address" : "phone number"} on file.` };

  const ctx = await buildContext(order);
  if (!ctx) return { ok: false, error: "Order has no tracking link yet." };

  await sendAndRecord(orderId, eventKey, channel, recipient, ctx);
  return { ok: true };
}

/** Re-sends a previously recorded notification attempt (typically a FAILED one) using current customer contact info. */
export async function resendNotification(notificationId: string): Promise<{ ok: boolean; error?: string }> {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification) return { ok: false, error: "Notification not found." };

  return sendManualNotification(notification.orderId, notification.channel as NotificationChannel, notification.eventKey);
}
