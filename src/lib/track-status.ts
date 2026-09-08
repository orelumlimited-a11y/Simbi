import { formatDate } from "@/lib/format";

export function getStatusMessage(stageKey: string, estimatedDeliveryDate: Date | null): { headline: string; sub?: string; tone: "normal" | "success" | "warning" } {
  switch (stageKey) {
    case "ORDER_CREATED":
      return { headline: "Your order has been created.", tone: "normal" };
    case "PAYMENT_CONFIRMED":
      return { headline: "Payment confirmed. Preparing your order.", tone: "normal" };
    case "AWAITING_PICKUP":
      return { headline: "Your package is awaiting pickup.", tone: "normal" };
    case "PICKED_UP":
      return { headline: "Your package has been picked up.", tone: "normal" };
    case "AT_SORTING_FACILITY":
      return { headline: "Your package is at our sorting facility.", tone: "normal" };
    case "IN_TRANSIT":
      return { headline: "Your package is in transit.", tone: "normal" };
    case "ARRIVED_AT_LOCAL_FACILITY":
      return { headline: "Your package has arrived at the local facility.", tone: "normal" };
    case "OUT_FOR_DELIVERY":
      return { headline: "Your package is out for delivery.", tone: "normal" };
    case "DELIVERED":
      return { headline: "Your package has been delivered.", tone: "success" };
    case "DELIVERY_ATTEMPTED":
      return { headline: "A delivery attempt was made.", sub: "We'll try again soon, or contact support to arrange redelivery.", tone: "warning" };
    case "DELIVERY_DELAYED":
      return {
        headline: "Your delivery has been delayed.",
        sub: estimatedDeliveryDate ? `We expect delivery by ${formatDate(estimatedDeliveryDate)}.` : "We're working to get your package to you as soon as possible.",
        tone: "warning",
      };
    case "ADDRESS_ISSUE":
      return { headline: "There's an issue with the delivery address.", sub: "Please contact support to confirm your address.", tone: "warning" };
    case "CUSTOMER_UNAVAILABLE":
      return { headline: "We couldn't reach you for delivery.", sub: "We'll attempt delivery again, or contact support to reschedule.", tone: "warning" };
    case "RETURNED_TO_SENDER":
      return { headline: "This package was returned to sender.", tone: "warning" };
    case "CANCELLED":
      return { headline: "This order has been cancelled.", tone: "warning" };
    default:
      return { headline: "Tracking your package.", tone: "normal" };
  }
}
