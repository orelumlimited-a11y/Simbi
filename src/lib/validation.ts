import { z } from "zod";
import {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  PRIORITIES,
  EXPENSE_CATEGORIES,
  DRIVER_STATUSES,
  VEHICLE_STATUSES,
  ROLES,
} from "@/lib/constants";
import { COUNTRIES } from "@/lib/countries";

const COUNTRY_CODES = COUNTRIES.map((c) => c.code) as [string, ...string[]];
const CURRENCY_CODES = Array.from(new Set(COUNTRIES.map((c) => c.currency))) as [string, ...string[]];

const optionalStr = z.string().trim().max(2000).optional().or(z.literal(""));

export const packageSchema = z.object({
  description: z.string().trim().min(1, "Package description is required").max(500),
  packageType: z.string().trim().min(1),
  quantity: z.coerce.number().int().min(1).max(10000),
  weightKg: z.coerce.number().min(0.01).max(50000),
  lengthCm: z.coerce.number().min(0).max(10000).optional(),
  widthCm: z.coerce.number().min(0).max(10000).optional(),
  heightCm: z.coerce.number().min(0).max(10000).optional(),
  specialHandling: optionalStr,
  productId: z.string().optional().or(z.literal("")),
});

export const createOrderSchema = z.object({
  // Customer
  customerId: z.string().optional(),
  customerName: z.string().trim().min(1).max(200).optional(),
  customerCompany: optionalStr,
  customerEmail: z.string().trim().email().optional().or(z.literal("")),
  customerPhone: z.string().trim().min(1).max(50).optional(),

  // Sender
  senderName: z.string().trim().min(1, "Sender name is required").max(200),
  senderPhone: z.string().trim().min(1, "Sender phone is required").max(50),
  pickupAddress: z.string().trim().min(1, "Pickup address is required").max(500),
  pickupCity: z.string().trim().min(1, "Pickup city is required").max(200),
  pickupPostcode: z.string().trim().min(1, "Pickup postcode is required").max(50),
  pickupCountry: z.string().trim().min(1, "Pickup country is required").max(100),

  // Recipient
  recipientName: z.string().trim().min(1, "Recipient name is required").max(200),
  recipientPhone: z.string().trim().min(1, "Recipient phone is required").max(50),
  deliveryAddress: z.string().trim().min(1, "Delivery address is required").max(500),
  deliveryCity: z.string().trim().min(1, "Delivery city is required").max(200),
  deliveryPostcode: z.string().trim().min(1, "Delivery postcode is required").max(50),
  deliveryCountry: z.string().trim().min(1, "Delivery country is required").max(100),

  // Package(s)
  packages: z.array(packageSchema).min(1, "At least one package is required"),

  // Delivery info
  serviceId: z.string().min(1, "Service is required"),
  priority: z.enum(PRIORITIES).default("STANDARD"),
  estimatedPickupDate: z.string().optional().or(z.literal("")),
  estimatedDeliveryDate: z.string().optional().or(z.literal("")),
  driverId: z.string().optional().or(z.literal("")),
  vehicleId: z.string().optional().or(z.literal("")),
  deliveryInstructions: optionalStr,

  // Financials
  customerPrice: z.coerce.number().min(0).default(0),
  deliveryCost: z.coerce.number().min(0).default(0),
  driverCost: z.coerce.number().min(0).default(0),
  additionalFees: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  tax: z.coerce.number().min(0).default(0),
  paymentStatus: z.enum(PAYMENT_STATUSES).default("UNPAID"),
  paymentMethod: z.enum(PAYMENT_METHODS).optional().or(z.literal("")),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateStatusSchema = z.object({
  orderId: z.string().min(1),
  newStageKey: z.string().min(1),
  location: optionalStr,
  note: optionalStr,
});

export const assignDriverSchema = z.object({
  orderId: z.string().min(1),
  driverId: z.string().min(1),
  vehicleId: z.string().optional().or(z.literal("")),
});

export const customerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  company: optionalStr,
  email: z.string().trim().email("Valid email required"),
  phone: z.string().trim().min(1, "Phone is required").max(50),
  address: optionalStr,
  city: optionalStr,
  postcode: optionalStr,
  country: optionalStr,
  emailOptIn: z.boolean().default(true),
  smsOptIn: z.boolean().default(false),
  whatsappOptIn: z.boolean().default(false),
});

export const driverSchema = z.object({
  name: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(1).max(50),
  email: z.string().trim().email(),
  vehicleId: z.string().optional().or(z.literal("")),
  status: z.enum(DRIVER_STATUSES).default("ACTIVE"),
  createLogin: z.boolean().optional(),
  password: z.string().min(8).optional().or(z.literal("")),
});

export const vehicleSchema = z.object({
  type: z.string().trim().min(1).max(100),
  registration: z.string().trim().min(1).max(50),
  capacityKg: z.coerce.number().min(0).optional(),
  status: z.enum(VEHICLE_STATUSES).default("ACTIVE"),
});

export const userSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email(),
  role: z.enum(ROLES),
  financeAccess: z.boolean().optional(),
  password: z.string().min(8).max(200),
});

export const expenseSchema = z.object({
  orderId: z.string().optional().or(z.literal("")),
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.coerce.number().min(0),
  description: optionalStr,
  date: z.string().optional().or(z.literal("")),
});

export const serviceSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: optionalStr,
  basePrice: z.coerce.number().min(0),
  active: z.boolean().optional(),
});

export const vendorSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  contactName: optionalStr,
  email: z.string().trim().email("Valid email required").optional().or(z.literal("")),
  phone: optionalStr,
  address: optionalStr,
  city: optionalStr,
  country: optionalStr,
  notes: optionalStr,
});

export const productSchema = z.object({
  sku: optionalStr,
  name: z.string().trim().min(1, "Name is required").max(200),
  description: optionalStr,
  unit: z.string().trim().min(1).max(30).default("pcs"),
  reorderLevel: z.coerce.number().int().min(0).default(0),
});

export const stockReceiptSchema = z
  .object({
    productId: z.string().optional().or(z.literal("")),
    newProductName: optionalStr,
    newProductUnit: z.string().trim().max(30).optional().or(z.literal("")),
    vendorId: z.string().min(1, "Vendor is required"),
    quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
    unitCost: z.coerce.number().min(0).default(0),
    receivedAt: z.string().optional().or(z.literal("")),
    note: optionalStr,
  })
  .refine((data) => (data.productId && data.productId !== "__new__") || data.newProductName, {
    message: "Select a product or enter a new product name",
    path: ["productId"],
  });

export const companySettingsSchema = z.object({
  name: z.string().trim().min(1).max(200),
  logoUrl: optionalStr,
  address: optionalStr,
  phone: optionalStr,
  email: z.string().trim().email().optional().or(z.literal("")),
  website: optionalStr,
  countryCode: z.enum(COUNTRY_CODES),
  currency: z.enum(CURRENCY_CODES),
});
