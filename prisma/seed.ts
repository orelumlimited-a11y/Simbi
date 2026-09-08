import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { DEFAULT_STAGES, DEFAULT_SERVICES, NOTIFICATION_EVENTS } from "../src/lib/constants";

const prisma = new PrismaClient();

function hash(pw: string) {
  return bcrypt.hashSync(pw, 10);
}

function token() {
  return randomBytes(24).toString("base64url");
}

async function orderNumber(year: number, seq: number) {
  return `LGS-${year}-${String(seq).padStart(6, "0")}`;
}

async function main() {
  console.log("Seeding: company settings, stages, services, notification settings...");

  await prisma.companySettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      name: "Simbi Logistics",
      address: "42 Harbor Way, Springfield, United States",
      phone: "+1 (555) 010-2030",
      email: "support@simbilogistics.example",
      website: "https://simbilogistics.example",
      countryCode: "US",
      currency: "USD",
    },
  });

  for (const stage of DEFAULT_STAGES) {
    await prisma.deliveryStage.upsert({
      where: { key: stage.key },
      update: {
        label: stage.label,
        sortOrder: stage.sortOrder,
        color: stage.color,
        isTerminalSuccess: !!stage.isTerminalSuccess,
        isTerminalFailure: !!stage.isTerminalFailure,
        isProblem: !!stage.isProblem,
      },
      create: {
        key: stage.key,
        label: stage.label,
        sortOrder: stage.sortOrder,
        color: stage.color,
        isTerminalSuccess: !!stage.isTerminalSuccess,
        isTerminalFailure: !!stage.isTerminalFailure,
        isProblem: !!stage.isProblem,
      },
    });
  }

  for (const svc of DEFAULT_SERVICES) {
    await prisma.service.upsert({
      where: { name: svc.name },
      update: {},
      create: svc,
    });
  }

  for (const evt of NOTIFICATION_EVENTS) {
    await prisma.notificationSetting.upsert({
      where: { eventKey: evt.key },
      update: {},
      create: { eventKey: evt.key, label: evt.label, emailEnabled: true },
    });
  }

  console.log("Seeding: users...");

  const admin = await prisma.user.upsert({
    where: { email: "admin@simbilogistics.example" },
    update: {},
    create: {
      name: "Alex Morgan",
      email: "admin@simbilogistics.example",
      passwordHash: hash("Admin123!"),
      role: "ADMIN",
      financeAccess: true,
    },
  });

  const ops = await prisma.user.upsert({
    where: { email: "ops@simbilogistics.example" },
    update: {},
    create: {
      name: "Jordan Lee",
      email: "ops@simbilogistics.example",
      passwordHash: hash("Ops123!"),
      role: "OPERATIONS",
      financeAccess: false,
    },
  });

  const driverUser1 = await prisma.user.upsert({
    where: { email: "driver1@simbilogistics.example" },
    update: {},
    create: {
      name: "Sam Rivera",
      email: "driver1@simbilogistics.example",
      passwordHash: hash("Driver123!"),
      role: "DRIVER",
    },
  });

  const driverUser2 = await prisma.user.upsert({
    where: { email: "driver2@simbilogistics.example" },
    update: {},
    create: {
      name: "Casey Nguyen",
      email: "driver2@simbilogistics.example",
      passwordHash: hash("Driver123!"),
      role: "DRIVER",
    },
  });

  console.log("Seeding: vehicles & drivers...");

  const van1 = await prisma.vehicle.upsert({
    where: { registration: "SL-VAN-01" },
    update: {},
    create: { type: "Cargo Van", registration: "SL-VAN-01", capacityKg: 1200, status: "ACTIVE" },
  });

  const van2 = await prisma.vehicle.upsert({
    where: { registration: "SL-VAN-02" },
    update: {},
    create: { type: "Cargo Van", registration: "SL-VAN-02", capacityKg: 1000, status: "ACTIVE" },
  });

  const bike1 = await prisma.vehicle.upsert({
    where: { registration: "SL-BIKE-01" },
    update: {},
    create: { type: "Motorbike", registration: "SL-BIKE-01", capacityKg: 25, status: "ACTIVE" },
  });

  const driver1 = await prisma.driver.upsert({
    where: { driverCode: "DRV-001" },
    update: {},
    create: {
      driverCode: "DRV-001",
      name: "Sam Rivera",
      phone: "+1 (555) 220-1010",
      email: "driver1@simbilogistics.example",
      status: "ACTIVE",
      userId: driverUser1.id,
      vehicleId: van1.id,
    },
  });

  const driver2 = await prisma.driver.upsert({
    where: { driverCode: "DRV-002" },
    update: {},
    create: {
      driverCode: "DRV-002",
      name: "Casey Nguyen",
      phone: "+1 (555) 220-1020",
      email: "driver2@simbilogistics.example",
      status: "ACTIVE",
      userId: driverUser2.id,
      vehicleId: van2.id,
    },
  });

  await prisma.driver.upsert({
    where: { driverCode: "DRV-003" },
    update: {},
    create: {
      driverCode: "DRV-003",
      name: "Priya Shah",
      phone: "+1 (555) 220-1030",
      email: "priya.shah@simbilogistics.example",
      status: "ACTIVE",
      vehicleId: bike1.id,
    },
  });

  console.log("Seeding: customers...");

  const customersData = [
    { name: "Grace Hopper", company: "Acme Retail", email: "grace@acme.example", phone: "+1 555 300 1001", city: "Springfield", country: "United States", emailOptIn: true, smsOptIn: false, whatsappOptIn: false },
    { name: "Ken Watanabe", company: "Nimbus Foods", email: "ken@nimbusfoods.example", phone: "+1 555 300 1002", city: "Rivertown", country: "United States", emailOptIn: true, smsOptIn: true, whatsappOptIn: false },
    { name: "Maria Silva", company: null, email: "maria.silva@example.com", phone: "+1 555 300 1003", city: "Lakeside", country: "United States", emailOptIn: true, smsOptIn: false, whatsappOptIn: true },
    { name: "David Okafor", company: "Okafor Textiles", email: "david@okafortextiles.example", phone: "+1 555 300 1004", city: "Springfield", country: "United States", emailOptIn: true, smsOptIn: true, whatsappOptIn: true },
    { name: "Lena Fischer", company: null, email: "lena.fischer@example.com", phone: "+1 555 300 1005", city: "Hillcrest", country: "United States", emailOptIn: false, smsOptIn: true, whatsappOptIn: false },
  ];

  const customers = [];
  for (const c of customersData) {
    // Customer.email isn't a unique field in the schema, so upsert isn't
    // available here — find-or-create instead.
    const existing = await prisma.customer.findFirst({ where: { email: c.email } });
    const customer =
      existing ??
      (await prisma.customer.create({
        data: { ...c, address: `${Math.floor(Math.random() * 900) + 100} Main St`, postcode: "00000" },
      }));
    customers.push(customer);
  }

  console.log("Seeding: orders + status history...");

  const services = await prisma.service.findMany();
  const stages = await prisma.deliveryStage.findMany();
  const stageByKey = Object.fromEntries(stages.map((s) => [s.key, s]));

  function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // scenario definitions: [stageKey path progressed to, priceRange]
  const scenarios: { path: string[]; note?: string }[] = [
    { path: ["ORDER_CREATED"] },
    { path: ["ORDER_CREATED", "PAYMENT_CONFIRMED", "AWAITING_PICKUP"] },
    { path: ["ORDER_CREATED", "PAYMENT_CONFIRMED", "AWAITING_PICKUP", "PICKED_UP"] },
    { path: ["ORDER_CREATED", "PAYMENT_CONFIRMED", "AWAITING_PICKUP", "PICKED_UP", "AT_SORTING_FACILITY", "IN_TRANSIT"] },
    { path: ["ORDER_CREATED", "PAYMENT_CONFIRMED", "AWAITING_PICKUP", "PICKED_UP", "AT_SORTING_FACILITY", "IN_TRANSIT", "ARRIVED_AT_LOCAL_FACILITY", "OUT_FOR_DELIVERY"] },
    { path: ["ORDER_CREATED", "PAYMENT_CONFIRMED", "AWAITING_PICKUP", "PICKED_UP", "AT_SORTING_FACILITY", "IN_TRANSIT", "ARRIVED_AT_LOCAL_FACILITY", "OUT_FOR_DELIVERY", "DELIVERED"] },
    { path: ["ORDER_CREATED", "PAYMENT_CONFIRMED", "AWAITING_PICKUP", "PICKED_UP", "AT_SORTING_FACILITY", "IN_TRANSIT", "ARRIVED_AT_LOCAL_FACILITY", "OUT_FOR_DELIVERY", "DELIVERED"] },
    { path: ["ORDER_CREATED", "PAYMENT_CONFIRMED", "AWAITING_PICKUP", "PICKED_UP", "AT_SORTING_FACILITY", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERY_DELAYED"], note: "Traffic delay on route" },
    { path: ["ORDER_CREATED", "PAYMENT_CONFIRMED", "AWAITING_PICKUP", "PICKED_UP", "AT_SORTING_FACILITY", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERY_ATTEMPTED", "CUSTOMER_UNAVAILABLE"] },
    { path: ["ORDER_CREATED", "CANCELLED"], note: "Customer requested cancellation" },
  ];

  const recipients = [
    { name: "Tom Bishop", phone: "+1 555 700 2001", city: "Northgate", addr: "12 Elm St" },
    { name: "Olivia Chen", phone: "+1 555 700 2002", city: "Westfield", addr: "88 Pine Ave" },
    { name: "Marcus Webb", phone: "+1 555 700 2003", city: "Eastport", addr: "5 Cedar Rd" },
    { name: "Ines Duarte", phone: "+1 555 700 2004", city: "Southgate", addr: "231 Birch Blvd" },
  ];

  const drivers = [driver1, driver2];
  const packageTypes = ["Parcel", "Box", "Document", "Electronics", "Fragile Item"];

  let seq = 1;
  const year = new Date().getFullYear();

  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];
    const customer = pick(customers);
    const recipient = pick(recipients);
    const service = pick(services);
    const isCancelled = scenario.path.includes("CANCELLED");
    const isDelivered = scenario.path.includes("DELIVERED");

    const orderNum = await orderNumber(year, seq++);

    const customerPrice = Math.round((15 + Math.random() * 120) * 100) / 100;
    const deliveryCost = Math.round((customerPrice * 0.25 + Math.random() * 5) * 100) / 100;
    const driverCost = Math.round((customerPrice * 0.15 + Math.random() * 4) * 100) / 100;
    const additionalFees = Math.round(Math.random() * 5 * 100) / 100;
    const discount = Math.random() > 0.8 ? Math.round(Math.random() * 10 * 100) / 100 : 0;
    const tax = Math.round(customerPrice * 0.08 * 100) / 100;
    const totalCharged = Math.round((customerPrice + additionalFees + tax - discount) * 100) / 100;
    const estimatedProfit = Math.round((totalCharged - deliveryCost - driverCost) * 100) / 100;

    const createdDaysAgo = scenarios.length - i;
    const createdAt = new Date(Date.now() - createdDaysAgo * 24 * 60 * 60 * 1000);
    const estimatedDeliveryDate = new Date(createdAt.getTime() + 3 * 24 * 60 * 60 * 1000);

    const currentStageKey = scenario.path[scenario.path.length - 1];
    const driver = drivers[i % drivers.length];

    const order = await prisma.order.create({
      data: {
        orderNumber: orderNum,
        customerId: customer.id,
        senderName: customer.name,
        senderPhone: customer.phone,
        pickupAddress: customer.address ?? "1 Warehouse Dr",
        pickupCity: customer.city ?? "Springfield",
        pickupPostcode: customer.postcode ?? "00000",
        pickupCountry: customer.country ?? "United States",
        recipientName: recipient.name,
        recipientPhone: recipient.phone,
        deliveryAddress: recipient.addr,
        deliveryCity: recipient.city,
        deliveryPostcode: "10000",
        deliveryCountry: "United States",
        serviceId: service.id,
        priority: pick(["STANDARD", "STANDARD", "HIGH", "URGENT"]),
        estimatedPickupDate: new Date(createdAt.getTime() + 4 * 60 * 60 * 1000),
        estimatedDeliveryDate,
        actualDeliveryDate: isDelivered ? new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000) : null,
        driverId: scenario.path.length > 2 && !isCancelled ? driver.id : null,
        vehicleId: scenario.path.length > 2 && !isCancelled ? driver.vehicleId : null,
        deliveryInstructions: pick(["Leave at front desk", "Ring doorbell twice", "Call on arrival", ""]),
        currentStageKey,
        customerPrice,
        deliveryCost,
        driverCost,
        additionalFees,
        discount,
        tax,
        totalCharged,
        estimatedProfit,
        paymentStatus: isCancelled ? "REFUNDED" : isDelivered ? "PAID" : pick(["PAID", "UNPAID", "PARTIAL"]),
        paymentMethod: pick(["CARD", "ONLINE", "CASH", "BANK_TRANSFER"]),
        createdById: pick([admin.id, ops.id]),
        cancelledAt: isCancelled ? new Date(createdAt.getTime() + 12 * 60 * 60 * 1000) : null,
        cancelReason: isCancelled ? "Customer requested cancellation" : null,
        createdAt,
        packages: {
          create: [
            {
              description: pick(["Assorted goods", "Office supplies", "Clothing bundle", "Spare parts", "Gift package"]),
              packageType: pick(packageTypes),
              quantity: Math.ceil(Math.random() * 3),
              weightKg: Math.round((0.5 + Math.random() * 20) * 10) / 10,
              lengthCm: 30,
              widthCm: 20,
              heightCm: 15,
              specialHandling: Math.random() > 0.7 ? "Fragile - handle with care" : null,
            },
          ],
        },
      },
    });

    await prisma.trackingToken.create({
      data: { orderId: order.id, token: token() },
    });

    let prevKey: string | null = null;
    for (let s = 0; s < scenario.path.length; s++) {
      const stageKey = scenario.path[s];
      const eventTime = new Date(createdAt.getTime() + s * 5 * 60 * 60 * 1000);
      await prisma.orderStatusEvent.create({
        data: {
          orderId: order.id,
          previousStageKey: prevKey,
          newStageKey: stageKey,
          changedById: s === 0 ? order.createdById : pick([admin.id, ops.id, driverUser1.id, driverUser2.id]),
          changedByRole: s === 0 ? "ADMIN" : pick(["ADMIN", "OPERATIONS", "DRIVER"]),
          location: stageByKey[stageKey]?.label ?? "",
          note: s === scenario.path.length - 1 ? scenario.note ?? null : null,
          createdAt: eventTime,
        },
      });
      prevKey = stageKey;
    }

    // Financial records
    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: totalCharged,
        method: order.paymentMethod ?? "CARD",
        status: order.paymentStatus,
        paidAt: order.paymentStatus === "PAID" ? createdAt : null,
      },
    });

    await prisma.expense.create({
      data: {
        orderId: order.id,
        category: "DRIVER",
        amount: driverCost,
        description: "Driver payout",
        date: createdAt,
        createdById: admin.id,
      },
    });

    await prisma.expense.create({
      data: {
        orderId: order.id,
        category: "FUEL",
        amount: Math.round(deliveryCost * 0.3 * 100) / 100,
        description: "Fuel estimate",
        date: createdAt,
        createdById: admin.id,
      },
    });
  }

  await prisma.orderNumberCounter.upsert({
    where: { year },
    update: { count: seq - 1 },
    create: { year, count: seq - 1 },
  });

  console.log("Seed complete.");
  console.log("---------------------------------------------");
  console.log("Admin login:    admin@simbilogistics.example / Admin123!");
  console.log("Ops login:      ops@simbilogistics.example / Ops123!");
  console.log("Driver login:   driver1@simbilogistics.example / Driver123!");
  console.log("---------------------------------------------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
