import { OrderStatus } from "@/generated/client";

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: "New",
  BATCHED: "Accepted",
  RESCHEDULED: "Rescheduled",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERY_FAILED: "Delivery Failed",
  COMPLETED: "Delivered",
  CANCELLED: "Cancelled",
};

/**
 * The single canonical vendor-facing label for an order status.
 *
 * These are shop-type-neutral and must be used everywhere a status is shown,
 * so an order reads the same as it moves Intake -> Prep -> Dispatch.
 */
export function getOrderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABELS[status];
}

function ageInMinutes(createdAt: Date | string, now: Date): number {
  const created =
    typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  return Math.floor((now.getTime() - created.getTime()) / 60_000);
}

/**
 * Relative order age for queue triage ("12 min ago"), so a vendor can see at a
 * glance which order has been waiting longest.
 */
export function formatOrderAge(
  createdAt: Date | string,
  now: Date = new Date()
): string {
  const minutes = ageInMinutes(createdAt, now);
  if (minutes < 1) return "Just now";
  if (minutes === 1) return "1 min ago";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hr ago`;
}

const FOOD_THRESHOLDS = { warning: 5, critical: 15 };
const RETAIL_THRESHOLDS = { warning: 15, critical: 30 };

/**
 * How loudly to flag an unaccepted order's age.
 *
 * Food escalates sooner because it goes cold; retail uses gentler thresholds
 * so non-food vendors aren't trained to ignore a colour that cries wolf.
 */
export function getOrderAgeUrgency(
  createdAt: Date | string,
  isFood: boolean,
  now: Date = new Date()
): "normal" | "warning" | "critical" {
  const minutes = ageInMinutes(createdAt, now);
  const t = isFood ? FOOD_THRESHOLDS : RETAIL_THRESHOLDS;
  if (minutes >= t.critical) return "critical";
  if (minutes >= t.warning) return "warning";
  return "normal";
}
