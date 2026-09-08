"use client";

import { useActionState, useState } from "react";
import { createOrder, type ActionState } from "@/lib/actions/orders";
import { Field, inputClass, selectClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { PRIORITIES, PRIORITY_LABELS, PAYMENT_STATUSES, PAYMENT_STATUS_LABELS, PAYMENT_METHODS, PAYMENT_METHOD_LABELS, PACKAGE_TYPES } from "@/lib/constants";
import { COUNTRIES, getCountryByCode } from "@/lib/countries";
import { formatCurrency } from "@/lib/format";
import { Plus, Trash2 } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  company: string | null;
  email: string;
  phone: string;
  address: string | null;
  city: string | null;
  postcode: string | null;
  country: string | null;
}
interface Service {
  id: string;
  name: string;
  basePrice: number;
}
interface Driver {
  id: string;
  name: string;
  vehicleId: string | null;
}
interface Vehicle {
  id: string;
  type: string;
  registration: string;
}
interface ProductOption {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  currentUnitCost: number;
}

interface PackageRow {
  description: string;
  packageType: string;
  quantity: number;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  specialHandling: string;
  productId: string;
}

const emptyPackage: PackageRow = {
  description: "",
  packageType: "Parcel",
  quantity: 1,
  weightKg: 1,
  lengthCm: 30,
  widthCm: 20,
  heightCm: 15,
  specialHandling: "",
  productId: "",
};

const initialState: ActionState = {};

export function OrderForm({
  customers,
  services,
  drivers,
  vehicles,
  products,
  currency = "USD",
  locale = "en-US",
  defaultCountryCode = "US",
}: {
  customers: Customer[];
  services: Service[];
  drivers: Driver[];
  vehicles: Vehicle[];
  products: ProductOption[];
  currency?: string;
  locale?: string;
  defaultCountryCode?: string;
}) {
  const [state, formAction, pending] = useActionState(createOrder, initialState);
  const [mode, setMode] = useState<"existing" | "new">(customers.length ? "existing" : "new");
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [packages, setPackages] = useState<PackageRow[]>([emptyPackage]);
  const operatingCountryName = getCountryByCode(defaultCountryCode).name;

  const [customerPrice, setCustomerPrice] = useState(0);
  const [additionalFees, setAdditionalFees] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [driverCost, setDriverCost] = useState(0);

  const totalCharged = round2(customerPrice + additionalFees + tax - discount);
  const costOfGoods = round2(
    packages.reduce((sum, pkg) => {
      if (!pkg.productId) return sum;
      const product = products.find((p) => p.id === pkg.productId);
      return sum + (product ? pkg.quantity * product.currentUnitCost : 0);
    }, 0)
  );
  const estimatedProfit = round2(totalCharged - deliveryCost - driverCost - costOfGoods);

  function round2(n: number) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  function updatePackage(idx: number, patch: Partial<PackageRow>) {
    setPackages((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  }

  const selectedCustomer = customers.find((c) => c.id === customerId);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="packagesJson" value={JSON.stringify(packages)} />

      {state.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
          {state.error}
        </div>
      )}

      {/* Customer */}
      <Section title="Customer Information">
        <div className="mb-3 flex gap-2">
          <button type="button" onClick={() => setMode("existing")} className={tabClass(mode === "existing")}>
            Existing Customer
          </button>
          <button type="button" onClick={() => setMode("new")} className={tabClass(mode === "new")}>
            New Customer
          </button>
        </div>
        {mode === "existing" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Select customer" required>
              <select
                name="customerId"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className={selectClass}
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company ? `(${c.company})` : ""}
                  </option>
                ))}
              </select>
            </Field>
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
              {selectedCustomer && (
                <>
                  <p>{selectedCustomer.email}</p>
                  <p>{selectedCustomer.phone}</p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Customer name" required>
              <input name="customerName" required={mode === "new"} className={inputClass} />
            </Field>
            <Field label="Company name" hint="Optional">
              <input name="customerCompany" className={inputClass} />
            </Field>
            <Field label="Email" required>
              <input name="customerEmail" type="email" className={inputClass} />
            </Field>
            <Field label="Phone number" required>
              <input name="customerPhone" className={inputClass} />
            </Field>
          </div>
        )}
      </Section>

      {/* Sender */}
      <Section title="Sender Information">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Sender name" required>
            <input name="senderName" required defaultValue={selectedCustomer?.name} className={inputClass} />
          </Field>
          <Field label="Sender phone" required>
            <input name="senderPhone" required defaultValue={selectedCustomer?.phone} className={inputClass} />
          </Field>
          <Field label="Pickup address" required className="md:col-span-2">
            <input name="pickupAddress" required defaultValue={selectedCustomer?.address ?? ""} className={inputClass} />
          </Field>
          <Field label="Pickup city" required>
            <input name="pickupCity" required defaultValue={selectedCustomer?.city ?? ""} className={inputClass} />
          </Field>
          <Field label="Pickup postcode" required>
            <input name="pickupPostcode" required defaultValue={selectedCustomer?.postcode ?? ""} className={inputClass} />
          </Field>
          <Field label="Pickup country" required>
            <select name="pickupCountry" required defaultValue={selectedCustomer?.country || operatingCountryName} className={selectClass}>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.name}>{c.name}</option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      {/* Recipient */}
      <Section title="Recipient Information">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Recipient name" required>
            <input name="recipientName" required className={inputClass} />
          </Field>
          <Field label="Recipient phone" required>
            <input name="recipientPhone" required className={inputClass} />
          </Field>
          <Field label="Delivery address" required className="md:col-span-2">
            <input name="deliveryAddress" required className={inputClass} />
          </Field>
          <Field label="Delivery city" required>
            <input name="deliveryCity" required className={inputClass} />
          </Field>
          <Field label="Delivery postcode" required>
            <input name="deliveryPostcode" required className={inputClass} />
          </Field>
          <Field label="Delivery country" required>
            <select name="deliveryCountry" required defaultValue={operatingCountryName} className={selectClass}>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.name}>{c.name}</option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      {/* Packages */}
      <Section title="Package Information">
        <div className="space-y-4">
          {packages.map((pkg, idx) => (
            <div key={idx} className="rounded-lg border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Package {idx + 1}</span>
                {packages.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setPackages((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Field label="Description" required className="col-span-2">
                  <input
                    value={pkg.description}
                    onChange={(e) => updatePackage(idx, { description: e.target.value })}
                    className={inputClass}
                    required
                  />
                </Field>
                <Field label="Package type">
                  <select value={pkg.packageType} onChange={(e) => updatePackage(idx, { packageType: e.target.value })} className={selectClass}>
                    {PACKAGE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Quantity">
                  <input type="number" min={1} value={pkg.quantity} onChange={(e) => updatePackage(idx, { quantity: Number(e.target.value) })} className={inputClass} />
                </Field>
                <Field label="Weight (kg)">
                  <input type="number" step="0.1" min={0.1} value={pkg.weightKg} onChange={(e) => updatePackage(idx, { weightKg: Number(e.target.value) })} className={inputClass} />
                </Field>
                <Field label="Length (cm)">
                  <input type="number" value={pkg.lengthCm} onChange={(e) => updatePackage(idx, { lengthCm: Number(e.target.value) })} className={inputClass} />
                </Field>
                <Field label="Width (cm)">
                  <input type="number" value={pkg.widthCm} onChange={(e) => updatePackage(idx, { widthCm: Number(e.target.value) })} className={inputClass} />
                </Field>
                <Field label="Height (cm)">
                  <input type="number" value={pkg.heightCm} onChange={(e) => updatePackage(idx, { heightCm: Number(e.target.value) })} className={inputClass} />
                </Field>
                <Field label="Special handling" className="col-span-2 md:col-span-4">
                  <input
                    value={pkg.specialHandling}
                    onChange={(e) => updatePackage(idx, { specialHandling: e.target.value })}
                    placeholder="e.g. Fragile, keep upright"
                    className={inputClass}
                  />
                </Field>
                <Field label="Dispatch from vendor stock" hint="Optional — only if this package is being fulfilled from warehoused inventory" className="col-span-2 md:col-span-4">
                  <select
                    value={pkg.productId}
                    onChange={(e) => updatePackage(idx, { productId: e.target.value })}
                    className={selectClass}
                  >
                    <option value="">Not from stock</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} — {p.currentStock} {p.unit} available</option>
                    ))}
                  </select>
                  {(() => {
                    if (!pkg.productId) return null;
                    const product = products.find((p) => p.id === pkg.productId);
                    if (product && pkg.quantity > product.currentStock) {
                      return (
                        <p className="mt-1 text-xs text-red-600">
                          Only {product.currentStock} {product.unit} in stock — reduce quantity or the order will be rejected.
                        </p>
                      );
                    }
                    return null;
                  })()}
                </Field>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setPackages((prev) => [...prev, { ...emptyPackage }])}
            className="flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
          >
            <Plus className="h-4 w-4" /> Add another package
          </button>
        </div>
      </Section>

      {/* Delivery Info */}
      <Section title="Delivery Information">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Field label="Delivery service" required>
            <select name="serviceId" required className={selectClass} defaultValue={services[0]?.id}>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name} — {formatCurrency(s.basePrice, currency, locale)}</option>
              ))}
            </select>
          </Field>
          <Field label="Priority">
            <select name="priority" className={selectClass} defaultValue="STANDARD">
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
              ))}
            </select>
          </Field>
          <Field label="Estimated pickup date">
            <input name="estimatedPickupDate" type="datetime-local" className={inputClass} />
          </Field>
          <Field label="Estimated delivery date">
            <input name="estimatedDeliveryDate" type="datetime-local" className={inputClass} />
          </Field>
          <Field label="Assigned driver" hint="Optional — can assign later">
            <select name="driverId" className={selectClass} defaultValue="">
              <option value="">Unassigned</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Assigned vehicle" hint="Optional">
            <select name="vehicleId" className={selectClass} defaultValue="">
              <option value="">Unassigned</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.type} — {v.registration}</option>
              ))}
            </select>
          </Field>
          <Field label="Delivery instructions" className="md:col-span-2 lg:col-span-3">
            <textarea name="deliveryInstructions" rows={2} className={inputClass} placeholder="e.g. Leave with concierge, ring doorbell" />
          </Field>
        </div>
      </Section>

      {/* Financials */}
      <Section title="Financial Information">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Field label={`Customer price (${currency})`} required>
            <input name="customerPrice" type="number" step="0.01" min={0} value={customerPrice} onChange={(e) => setCustomerPrice(Number(e.target.value))} className={inputClass} />
          </Field>
          <Field label={`Delivery cost (${currency})`}>
            <input name="deliveryCost" type="number" step="0.01" min={0} value={deliveryCost} onChange={(e) => setDeliveryCost(Number(e.target.value))} className={inputClass} />
          </Field>
          <Field label={`Driver cost (${currency})`}>
            <input name="driverCost" type="number" step="0.01" min={0} value={driverCost} onChange={(e) => setDriverCost(Number(e.target.value))} className={inputClass} />
          </Field>
          <Field label={`Additional fees (${currency})`}>
            <input name="additionalFees" type="number" step="0.01" min={0} value={additionalFees} onChange={(e) => setAdditionalFees(Number(e.target.value))} className={inputClass} />
          </Field>
          <Field label={`Discount (${currency})`}>
            <input name="discount" type="number" step="0.01" min={0} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className={inputClass} />
          </Field>
          <Field label={`Tax / VAT (${currency})`}>
            <input name="tax" type="number" step="0.01" min={0} value={tax} onChange={(e) => setTax(Number(e.target.value))} className={inputClass} />
          </Field>
          <Field label="Payment status">
            <select name="paymentStatus" className={selectClass} defaultValue="UNPAID">
              {PAYMENT_STATUSES.map((p) => (
                <option key={p} value={p}>{PAYMENT_STATUS_LABELS[p]}</option>
              ))}
            </select>
          </Field>
          <Field label="Payment method">
            <select name="paymentMethod" className={selectClass} defaultValue="">
              <option value="">Not specified</option>
              {PAYMENT_METHODS.map((p) => (
                <option key={p} value={p}>{PAYMENT_METHOD_LABELS[p]}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 md:grid-cols-5">
          <SummaryStat label="Total Charged" value={totalCharged} currency={currency} locale={locale} />
          <SummaryStat label="Delivery + Driver Cost" value={deliveryCost + driverCost} currency={currency} locale={locale} />
          <SummaryStat label="Cost of Goods" value={costOfGoods} currency={currency} locale={locale} />
          <SummaryStat label="Estimated Profit" value={estimatedProfit} currency={currency} locale={locale} highlight />
          <SummaryStat label="Packages" value={packages.length} currency={currency} locale={locale} isCount />
        </div>
      </Section>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating order..." : "Create Order"}
        </Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-slate-900">{title}</h2>
      {children}
    </div>
  );
}

function tabClass(active: boolean) {
  return `rounded-lg px-3 py-1.5 text-xs font-medium ${active ? "bg-brand text-white" : "bg-slate-100 text-slate-600"}`;
}

function SummaryStat({
  label,
  value,
  currency,
  locale,
  highlight,
  isCount,
}: {
  label: string;
  value: number;
  currency: string;
  locale: string;
  highlight?: boolean;
  isCount?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-lg font-semibold ${highlight ? (value >= 0 ? "text-emerald-600" : "text-red-600") : "text-slate-900"}`}>
        {isCount ? value : formatCurrency(value, currency, locale)}
      </p>
    </div>
  );
}
