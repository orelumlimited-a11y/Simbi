-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderPhone" TEXT NOT NULL,
    "pickupAddress" TEXT NOT NULL,
    "pickupCity" TEXT NOT NULL,
    "pickupPostcode" TEXT NOT NULL,
    "pickupCountry" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "recipientPhone" TEXT NOT NULL,
    "deliveryAddress" TEXT NOT NULL,
    "deliveryCity" TEXT NOT NULL,
    "deliveryPostcode" TEXT NOT NULL,
    "deliveryCountry" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'STANDARD',
    "estimatedPickupDate" DATETIME,
    "estimatedDeliveryDate" DATETIME,
    "actualPickupDate" DATETIME,
    "actualDeliveryDate" DATETIME,
    "driverId" TEXT,
    "vehicleId" TEXT,
    "deliveryInstructions" TEXT,
    "currentStageKey" TEXT NOT NULL,
    "customerPrice" REAL NOT NULL DEFAULT 0,
    "deliveryCost" REAL NOT NULL DEFAULT 0,
    "driverCost" REAL NOT NULL DEFAULT 0,
    "additionalFees" REAL NOT NULL DEFAULT 0,
    "discount" REAL NOT NULL DEFAULT 0,
    "tax" REAL NOT NULL DEFAULT 0,
    "totalCharged" REAL NOT NULL DEFAULT 0,
    "costOfGoods" REAL NOT NULL DEFAULT 0,
    "estimatedProfit" REAL NOT NULL DEFAULT 0,
    "stockRestored" BOOLEAN NOT NULL DEFAULT false,
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "paymentMethod" TEXT,
    "createdById" TEXT NOT NULL,
    "cancelledAt" DATETIME,
    "cancelReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_currentStageKey_fkey" FOREIGN KEY ("currentStageKey") REFERENCES "DeliveryStage" ("key") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("actualDeliveryDate", "actualPickupDate", "additionalFees", "cancelReason", "cancelledAt", "createdAt", "createdById", "currentStageKey", "customerId", "customerPrice", "deliveryAddress", "deliveryCity", "deliveryCost", "deliveryCountry", "deliveryInstructions", "deliveryPostcode", "discount", "driverCost", "driverId", "estimatedDeliveryDate", "estimatedPickupDate", "estimatedProfit", "id", "orderNumber", "paymentMethod", "paymentStatus", "pickupAddress", "pickupCity", "pickupCountry", "pickupPostcode", "priority", "recipientName", "recipientPhone", "senderName", "senderPhone", "serviceId", "tax", "totalCharged", "updatedAt", "vehicleId") SELECT "actualDeliveryDate", "actualPickupDate", "additionalFees", "cancelReason", "cancelledAt", "createdAt", "createdById", "currentStageKey", "customerId", "customerPrice", "deliveryAddress", "deliveryCity", "deliveryCost", "deliveryCountry", "deliveryInstructions", "deliveryPostcode", "discount", "driverCost", "driverId", "estimatedDeliveryDate", "estimatedPickupDate", "estimatedProfit", "id", "orderNumber", "paymentMethod", "paymentStatus", "pickupAddress", "pickupCity", "pickupCountry", "pickupPostcode", "priority", "recipientName", "recipientPhone", "senderName", "senderPhone", "serviceId", "tax", "totalCharged", "updatedAt", "vehicleId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");
CREATE INDEX "Order_driverId_idx" ON "Order"("driverId");
CREATE INDEX "Order_currentStageKey_idx" ON "Order"("currentStageKey");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
CREATE TABLE "new_Package" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "packageType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "weightKg" REAL NOT NULL,
    "lengthCm" REAL,
    "widthCm" REAL,
    "heightCm" REAL,
    "specialHandling" TEXT,
    "productId" TEXT,
    "unitCost" REAL NOT NULL DEFAULT 0,
    "costOfGoods" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "Package_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Package_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Package" ("description", "heightCm", "id", "lengthCm", "orderId", "packageType", "quantity", "specialHandling", "weightKg", "widthCm") SELECT "description", "heightCm", "id", "lengthCm", "orderId", "packageType", "quantity", "specialHandling", "weightKg", "widthCm" FROM "Package";
DROP TABLE "Package";
ALTER TABLE "new_Package" RENAME TO "Package";
CREATE INDEX "Package_orderId_idx" ON "Package"("orderId");
CREATE INDEX "Package_productId_idx" ON "Package"("productId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
