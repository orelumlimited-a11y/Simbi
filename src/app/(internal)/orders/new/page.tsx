import { prisma } from "@/lib/prisma";
import { getCompanyLocale } from "@/lib/company";
import { OrderForm } from "@/components/orders/OrderForm";

export default async function NewOrderPage() {
  const [customers, services, drivers, vehicles, products, { currency, locale, countryCode }] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.service.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.driver.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
    prisma.vehicle.findMany({ where: { status: "ACTIVE" }, orderBy: { type: "asc" } }),
    prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    getCompanyLocale(),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Create New Order</h1>
        <p className="text-sm text-slate-500">
          A unique order number and secure tracking link are generated automatically when the order is created.
        </p>
      </div>
      <OrderForm
        customers={customers}
        services={services}
        drivers={drivers}
        vehicles={vehicles}
        products={products}
        currency={currency}
        locale={locale}
        defaultCountryCode={countryCode}
      />
    </div>
  );
}
