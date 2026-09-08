// Central source of truth for all "enum-like" string values used across the
// app. SQLite/Prisma stores these as plain strings (see prisma/schema.prisma
// header note); this file + Zod schemas are what actually enforces them.

export const ROLES = ["ADMIN", "OPERATIONS", "DRIVER"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrator",
  OPERATIONS: "Operations Staff",
  DRIVER: "Driver",
};

export const DRIVER_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type DriverStatus = (typeof DRIVER_STATUSES)[number];

export const VEHICLE_STATUSES = ["ACTIVE", "MAINTENANCE", "INACTIVE"] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export const PRIORITIES = ["STANDARD", "HIGH", "URGENT"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_LABELS: Record<Priority, string> = {
  STANDARD: "Standard",
  HIGH: "High",
  URGENT: "Urgent",
};

export const PAYMENT_STATUSES = ["UNPAID", "PARTIAL", "PAID", "REFUNDED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "Unpaid",
  PARTIAL: "Partially Paid",
  PAID: "Paid",
  REFUNDED: "Refunded",
};

export const PAYMENT_METHODS = ["CASH", "CARD", "BANK_TRANSFER", "ONLINE", "INVOICE"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Cash",
  CARD: "Card",
  BANK_TRANSFER: "Bank Transfer",
  ONLINE: "Online Payment",
  INVOICE: "Invoice",
};

export const EXPENSE_CATEGORIES = [
  "DRIVER",
  "FUEL",
  "DELIVERY",
  "PACKAGING",
  "THIRD_PARTY_CARRIER",
  "COST_OF_GOODS",
  "OTHER",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  DRIVER: "Driver Cost",
  FUEL: "Fuel",
  DELIVERY: "Delivery / Courier",
  PACKAGING: "Packaging",
  THIRD_PARTY_CARRIER: "Third-Party Carrier",
  COST_OF_GOODS: "Cost of Goods",
  OTHER: "Other",
};

export const NOTIFICATION_CHANNELS = ["EMAIL", "SMS", "WHATSAPP"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const NOTIFICATION_STATUSES = ["PENDING", "SENT", "FAILED", "DISABLED"] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

export const NOTIFICATION_EVENTS = [
  { key: "ORDER_CREATED", label: "Order Created" },
  { key: "PAYMENT_CONFIRMED", label: "Payment Confirmed" },
  { key: "PICKED_UP", label: "Package Picked Up" },
  { key: "IN_TRANSIT", label: "Package In Transit" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "DELIVERY_DELAYED", label: "Delivery Delayed" },
] as const;

// ---------------------------------------------------------------------------
// Delivery stage workflow (default seed — editable in Settings via
// DeliveryStage table, so this is a fallback/seed list, not a hard enum)
// ---------------------------------------------------------------------------

export type StageColor = "grey" | "blue" | "orange" | "red" | "green";

export interface DeliveryStageSeed {
  key: string;
  label: string;
  sortOrder: number;
  color: StageColor;
  isTerminalSuccess?: boolean;
  isTerminalFailure?: boolean;
  isProblem?: boolean;
}

export const DEFAULT_STAGES: DeliveryStageSeed[] = [
  { key: "ORDER_CREATED", label: "Order Created", sortOrder: 10, color: "grey" },
  { key: "PAYMENT_CONFIRMED", label: "Payment Confirmed", sortOrder: 20, color: "grey" },
  { key: "AWAITING_PICKUP", label: "Awaiting Pickup", sortOrder: 30, color: "grey" },
  { key: "PICKED_UP", label: "Picked Up", sortOrder: 40, color: "blue" },
  { key: "AT_SORTING_FACILITY", label: "At Sorting Facility", sortOrder: 50, color: "blue" },
  { key: "IN_TRANSIT", label: "In Transit", sortOrder: 60, color: "blue" },
  { key: "ARRIVED_AT_LOCAL_FACILITY", label: "Arrived at Local Facility", sortOrder: 70, color: "blue" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", sortOrder: 80, color: "blue" },
  { key: "DELIVERED", label: "Delivered", sortOrder: 90, color: "green", isTerminalSuccess: true },
  // Additional / exception statuses (not part of the linear happy path,
  // shown with a high sortOrder so they render after the path when listed)
  { key: "DELIVERY_ATTEMPTED", label: "Delivery Attempted", sortOrder: 81, color: "orange", isProblem: true },
  { key: "DELIVERY_DELAYED", label: "Delivery Delayed", sortOrder: 82, color: "red", isProblem: true },
  { key: "ADDRESS_ISSUE", label: "Address Issue", sortOrder: 83, color: "red", isProblem: true },
  { key: "CUSTOMER_UNAVAILABLE", label: "Customer Unavailable", sortOrder: 84, color: "orange", isProblem: true },
  { key: "RETURNED_TO_SENDER", label: "Returned to Sender", sortOrder: 95, color: "red", isTerminalFailure: true },
  { key: "CANCELLED", label: "Cancelled", sortOrder: 100, color: "red", isTerminalFailure: true },
];

// The "happy path" used to render the customer-facing progress timeline.
export const HAPPY_PATH_KEYS = [
  "ORDER_CREATED",
  "PICKED_UP",
  "AT_SORTING_FACILITY",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export const STAGE_COLOR_CLASSES: Record<StageColor, { bg: string; text: string; ring: string; dot: string }> = {
  grey: { bg: "bg-slate-100", text: "text-slate-600", ring: "ring-slate-300", dot: "bg-slate-400" },
  blue: { bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-300", dot: "bg-blue-500" },
  orange: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-300", dot: "bg-amber-500" },
  red: { bg: "bg-red-50", text: "text-red-700", ring: "ring-red-300", dot: "bg-red-500" },
  green: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-300", dot: "bg-emerald-500" },
};

export const PACKAGE_TYPES = [
  "Document",
  "Parcel",
  "Box",
  "Pallet",
  "Fragile Item",
  "Perishable",
  "Electronics",
  "Other",
];

export const DEFAULT_SERVICES = [
  { name: "Same Day", basePrice: 25, description: "Delivered within the same business day", sortOrder: 10 },
  { name: "Next Day", basePrice: 15, description: "Delivered the following business day", sortOrder: 20 },
  { name: "Express", basePrice: 20, description: "Priority handling, fastest standard option", sortOrder: 30 },
  { name: "Standard", basePrice: 8, description: "2-4 business days", sortOrder: 40 },
  { name: "International", basePrice: 45, description: "Cross-border delivery", sortOrder: 50 },
];
