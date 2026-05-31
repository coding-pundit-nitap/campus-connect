/**
 * Shared order utilities — single source of truth for address parsing and
 * order display helpers used across vendor dashboard, order console, and
 * order cards.
 */

import type { SerializedOrderWithDetails } from "@/types";

/* ─── Address Snapshot ─── */

export interface AddressSnapshot {
  hostel_block?: string | null;
  building?: string | null;
  room_number?: string | null;
}

// Regex hoisted to module level per `js-hoist-regexp` rule
const ADDRESS_FALLBACK_REGEX =
  /^\s*(?<building>.*?)(?:,\s*Room\s*(?<room>.+))?\s*$/i;

/**
 * Safely parse delivery address from an order. Handles:
 * - Populated `delivery_address` relation
 * - Valid JSON snapshot string
 * - Fallback regex for plain-text snapshot
 * - Null/undefined/malformed data
 */
export function safeParseAddress(
  order: SerializedOrderWithDetails
): AddressSnapshot {
  // Prefer the hydrated relation if available
  if (order.delivery_address) {
    return {
      hostel_block: order.delivery_address.hostel_block,
      building: order.delivery_address.building,
      room_number: order.delivery_address.room_number,
    };
  }

  // Try JSON parse on snapshot
  if (order.delivery_address_snapshot) {
    try {
      const parsed = JSON.parse(order.delivery_address_snapshot);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      // Fallback: regex-parse plain-text address
      const match = order.delivery_address_snapshot.match(
        ADDRESS_FALLBACK_REGEX
      );
      if (match?.groups) {
        return {
          building: match.groups.building || null,
          room_number: match.groups.room || null,
        };
      }
    }
  }

  return {};
}

/* ─── Display Helpers ─── */

export function getHostel(order: SerializedOrderWithDetails): string {
  const a = safeParseAddress(order);
  return a.hostel_block || a.building || "Other";
}

export function getRoom(order: SerializedOrderWithDetails): string {
  return safeParseAddress(order).room_number || "N/A";
}

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
    const key = getHostel(order);
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
