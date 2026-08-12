import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export type EarningsPeriod = "today" | "week" | "month";

export interface OrderMoneyRow {
  item_total: number;
  delivery_fee: number;
  platform_fee: number;
  total_price: number;
  payment_method: "CASH" | "ONLINE";
}

export interface EarningsBreakdown {
  customersPaid: number;
  platformFee: number;
  vendorEarnings: number;
  orderCount: number;
  cash: { earnings: number; platformFeeOwed: number; orderCount: number };
  online: { earnings: number; orderCount: number };
}

/** Rupees to integer paise. Money is stored as Decimal(10,2), so this is exact. */
const toPaise = (rupees: number) => Math.round(rupees * 100);
const toRupees = (paise: number) => paise / 100;

/**
 * Aggregates a period's orders into the figures the vendor sees.
 *
 * Vendor earnings are `item_total + delivery_fee`. The platform fee is NEVER
 * subtracted: checkout charges it to the customer on top of the order
 * (`order.service.ts`), so it never comes out of the vendor's pocket.
 *
 * Sums are accumulated in integer paise so that many small orders cannot drift.
 */
export function aggregateEarnings(orders: OrderMoneyRow[]): EarningsBreakdown {
  let customersPaid = 0;
  let platformFee = 0;
  let vendorEarnings = 0;
  let cashEarnings = 0;
  let cashFeeOwed = 0;
  let cashCount = 0;
  let onlineEarnings = 0;
  let onlineCount = 0;

  for (const o of orders) {
    const earned = toPaise(o.item_total) + toPaise(o.delivery_fee);
    const fee = toPaise(o.platform_fee);

    vendorEarnings += earned;
    platformFee += fee;
    customersPaid += toPaise(o.total_price);

    if (o.payment_method === "CASH") {
      cashEarnings += earned;
      cashFeeOwed += fee;
      cashCount += 1;
    } else {
      onlineEarnings += earned;
      onlineCount += 1;
    }
  }

  return {
    customersPaid: toRupees(customersPaid),
    platformFee: toRupees(platformFee),
    vendorEarnings: toRupees(vendorEarnings),
    orderCount: orders.length,
    cash: {
      earnings: toRupees(cashEarnings),
      platformFeeOwed: toRupees(cashFeeOwed),
      orderCount: cashCount,
    },
    online: {
      earnings: toRupees(onlineEarnings),
      orderCount: onlineCount,
    },
  };
}

/**
 * Inclusive date range for a period, in the server's local timezone.
 *
 * Weeks start on Monday, matching how a shopkeeper thinks about a working week.
 */
export function getPeriodRange(
  period: EarningsPeriod,
  now: Date = new Date()
): { start: Date; end: Date } {
  switch (period) {
    case "week":
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
      };
    case "month":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case "today":
    default:
      return { start: startOfDay(now), end: endOfDay(now) };
  }
}
