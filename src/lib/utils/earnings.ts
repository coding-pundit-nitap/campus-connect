import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

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

/** Timezone pinned to India Standard Time for all period calculations. */
const VENDOR_TIMEZONE = "Asia/Kolkata";

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
 *
 * Precondition: `total_price` must equal `item_total + delivery_fee + platform_fee`.
 * The invariant `customersPaid === vendorEarnings + platformFee` holds only because
 * checkout writes consistent rows. This function does not guard against mismatched values.
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
 * Inclusive date range for a period, computed in Asia/Kolkata timezone.
 *
 * Boundaries are always calculated in IST regardless of the server's timezone,
 * ensuring consistent vendor earnings windows across deployments. Returns absolute
 * Date instants (UTC points) that correctly bracket the IST period boundaries.
 *
 * Weeks start on Monday, matching how a shopkeeper thinks about a working week.
 * For example, at 2026-08-12T15:30:00Z (21:00 IST), "today" covers
 * 2026-08-10T18:30:00Z to 2026-08-11T18:29:59.999Z in UTC (00:00 to 23:59:59 IST).
 */
export function getPeriodRange(
  period: EarningsPeriod,
  now: Date = new Date()
): { start: Date; end: Date } {
  // Convert UTC input to IST to find boundaries in that timezone
  const nowInIST = toZonedTime(now, VENDOR_TIMEZONE);

  let boundaryStart: Date;
  let boundaryEnd: Date;

  switch (period) {
    case "week":
      boundaryStart = startOfWeek(nowInIST, { weekStartsOn: 1 });
      boundaryEnd = endOfWeek(nowInIST, { weekStartsOn: 1 });
      break;
    case "month":
      boundaryStart = startOfMonth(nowInIST);
      boundaryEnd = endOfMonth(nowInIST);
      break;
    case "today":
    default:
      boundaryStart = startOfDay(nowInIST);
      boundaryEnd = endOfDay(nowInIST);
      break;
  }

  // Convert boundaries back to UTC
  return {
    start: fromZonedTime(boundaryStart, VENDOR_TIMEZONE),
    end: fromZonedTime(boundaryEnd, VENDOR_TIMEZONE),
  };
}
