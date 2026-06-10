/**
 * Shared order utilities — single source of truth for address parsing and
 * order display helpers used across vendor dashboard, order console, and
 * order cards.
 */

import type { SerializedOrderWithDetails } from "@/types";

export function getItemsText(order: SerializedOrderWithDetails): string {
  return order.items.map((i) => `${i.quantity}× ${i.product.name}`).join(", ");
}

/**
 * Group orders by hostel/building. Uses a single pass (js-combine-iterations).
 */
export function groupByHostel(
  orders: SerializedOrderWithDetails[]
): Record<string, SerializedOrderWithDetails[]> {
  const groups: Record<string, SerializedOrderWithDetails[]> = {};
  for (const order of orders) {
    const key =
      order.delivery_address_snapshot?.hostel_block ||
      order.delivery_address_snapshot?.building ||
      "Other";
    (groups[key] ||= []).push(order);
  }
  return groups;
}

/**
 * Aggregate item quantities across orders. Uses Map for O(1) lookups
 * (js-set-map-lookups).
 */
export function buildPrepSummary(
  orders: SerializedOrderWithDetails[]
): { name: string; quantity: number }[] {
  const map = new Map<string, { name: string; quantity: number }>();
  for (const order of orders) {
    for (const item of order.items) {
      const cur = map.get(item.product.id) || {
        name: item.product.name,
        quantity: 0,
      };
      cur.quantity += item.quantity;
      map.set(item.product.id, cur);
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}
