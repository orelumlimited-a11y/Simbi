interface FinancialInputs {
  customerPrice: number;
  additionalFees: number;
  discount: number;
  tax: number;
  deliveryCost: number;
  driverCost: number;
  /** Vendor stock dispatched as part of this order, if any. */
  costOfGoods?: number;
}

/** total charged to the customer */
export function calcTotalCharged(f: Pick<FinancialInputs, "customerPrice" | "additionalFees" | "discount" | "tax">) {
  return round2(f.customerPrice + f.additionalFees + f.tax - f.discount);
}

/** revenue - (delivery cost + driver cost + cost of goods dispatched) = estimated profit */
export function calcEstimatedProfit(f: FinancialInputs) {
  const totalCharged = calcTotalCharged(f);
  const totalCosts = f.deliveryCost + f.driverCost + (f.costOfGoods ?? 0);
  return round2(totalCharged - totalCosts);
}

export function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function profitMargin(revenue: number, profit: number) {
  if (revenue <= 0) return 0;
  return round2((profit / revenue) * 100);
}
