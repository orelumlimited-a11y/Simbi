import { formatDate } from "@/lib/format";

interface OrderContext {
  orderNumber: string;
  recipientName: string;
  deliveryCity: string;
  estimatedDeliveryDate: Date | null;
  trackingUrl: string;
  companyName: string;
}

const EVENT_HEADLINES: Record<string, (ctx: OrderContext) => string> = {
  ORDER_CREATED: (ctx) => `Your order ${ctx.orderNumber} has been created`,
  PAYMENT_CONFIRMED: (ctx) => `Payment confirmed for order ${ctx.orderNumber}`,
  PICKED_UP: (ctx) => `Your package for order ${ctx.orderNumber} has been picked up`,
  IN_TRANSIT: (ctx) => `Your package for order ${ctx.orderNumber} is in transit`,
  OUT_FOR_DELIVERY: (ctx) => `Your package for order ${ctx.orderNumber} is out for delivery`,
  DELIVERED: (ctx) => `Your package for order ${ctx.orderNumber} has been delivered`,
  DELIVERY_DELAYED: (ctx) => `Your delivery for order ${ctx.orderNumber} has been delayed`,
};

export function buildEmailMessage(eventKey: string, ctx: OrderContext) {
  const headline = (EVENT_HEADLINES[eventKey] ?? (() => `Update on order ${ctx.orderNumber}`))(ctx);
  const eta = ctx.estimatedDeliveryDate ? `Estimated delivery: ${formatDate(ctx.estimatedDeliveryDate)}.` : "";

  return {
    subject: `${ctx.companyName}: ${headline}`,
    text: [
      `Hi ${ctx.recipientName},`,
      "",
      `${headline}.`,
      eta,
      `Destination: ${ctx.deliveryCity}.`,
      "",
      `Track your delivery: ${ctx.trackingUrl}`,
      "",
      `— ${ctx.companyName}`,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

export function buildShortMessage(eventKey: string, ctx: OrderContext) {
  const headline = (EVENT_HEADLINES[eventKey] ?? (() => `Update on order ${ctx.orderNumber}`))(ctx);
  return `${ctx.companyName}: ${headline}. Track: ${ctx.trackingUrl}`;
}
