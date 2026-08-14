import { describe, expect, it } from "vitest";

import { Order, OrderItem, Prisma } from "@/generated/client";

const { Decimal } = Prisma;
import { DeliveryAddressSnapshot, OrderWithDetails } from "@/types";

import {
  serializeOrder,
  serializeOrderItem,
  serializeOrderWithDetails,
} from "./order.utils";

const baseSnapshot: DeliveryAddressSnapshot = {
  hostel_block: "A",
  building: null,
  room_number: "101",
  notes: null,
};

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "order_1",
    display_id: "ORD-0001",
    item_total: new Decimal("199.99"),
    delivery_fee: new Decimal("10.00"),
    platform_fee: new Decimal("5.00"),
    total_price: new Decimal("214.99"),
    payment_method: "ONLINE",
    payment_status: "COMPLETED",
    order_status: "NEW",
    pg_payment_id: null,
    pg_refund_id: null,
    upi_transaction_id: null,
    delivery_address_snapshot: baseSnapshot,
    requested_delivery_time: null,
    estimated_delivery_time: null,
    actual_delivery_time: null,
    created_at: new Date("2026-08-14T10:00:00.000Z"),
    updated_at: new Date("2026-08-14T10:05:00.000Z"),
    assigned_to: null,
    customer_notes: null,
    cancellation_reason: null,
    delivery_otp: null,
    is_direct_delivery: false,
    user_id: "user_1",
    shop_id: "shop_1",
    batch_id: null,
    ...overrides,
  } as Order;
}

function makeOrderWithDetails(
  overrides: Partial<OrderWithDetails> = {}
): OrderWithDetails {
  return {
    ...makeOrder(),
    items: [],
    batch: null,
    user: null,
    ...overrides,
  } as OrderWithDetails;
}

describe("serializeOrderItem", () => {
  it("converts a Decimal price to a number without float drift", () => {
    const item = {
      id: "item_1",
      quantity: 3,
      price: new Decimal("49.99"),
      order_id: "order_1",
      product_id: "product_1",
    } as OrderItem;

    const result = serializeOrderItem(item);

    expect(typeof result.price).toBe("number");
    expect(result.price).toBe(49.99);
    expect(result.quantity).toBe(3);
  });
});

describe("serializeOrder", () => {
  it("converts every Decimal(10,2) money field to a precise number", () => {
    const order = makeOrder({
      item_total: new Decimal("1234.56"),
      delivery_fee: new Decimal("19.99"),
      platform_fee: new Decimal("5.01"),
      total_price: new Decimal("1259.56"),
    });

    const result = serializeOrder(order);

    expect(typeof result.item_total).toBe("number");
    expect(result.item_total).toBe(1234.56);
    expect(result.delivery_fee).toBe(19.99);
    expect(result.platform_fee).toBe(5.01);
    expect(result.total_price).toBe(1259.56);
  });

  it("survives a decimal value that is not exactly representable as a float sum", () => {
    // Decimal arithmetic (exact) vs. naive float arithmetic (0.1 + 0.2 = 0.30000000000000004)
    // must agree once serialized: the value stored in the DB is already the
    // correctly-rounded decimal, so Number(Decimal) must round-trip exactly.
    const order = makeOrder({
      item_total: new Decimal("0.1").plus(new Decimal("0.2")),
    });

    const result = serializeOrder(order);

    expect(result.item_total).toBe(0.3);
    expect(result.item_total).not.toBe(0.30000000000000004);
  });

  it("converts created_at and updated_at to ISO strings", () => {
    const order = makeOrder({
      created_at: new Date("2026-01-02T03:04:05.000Z"),
      updated_at: new Date("2026-01-02T03:05:00.000Z"),
    });

    const result = serializeOrder(order);

    expect(result.created_at).toBe("2026-01-02T03:04:05.000Z");
    expect(result.updated_at).toBe("2026-01-02T03:05:00.000Z");
  });

  it("maps null optional delivery timestamps to undefined", () => {
    const order = makeOrder({
      requested_delivery_time: null,
      estimated_delivery_time: null,
      actual_delivery_time: null,
    });

    const result = serializeOrder(order);

    expect(result.requested_delivery_time).toBeUndefined();
    expect(result.estimated_delivery_time).toBeUndefined();
    expect(result.actual_delivery_time).toBeUndefined();
  });

  it("converts present optional delivery timestamps to ISO strings", () => {
    const order = makeOrder({
      requested_delivery_time: new Date("2026-01-02T12:00:00.000Z"),
      estimated_delivery_time: new Date("2026-01-02T12:30:00.000Z"),
      actual_delivery_time: new Date("2026-01-02T12:45:00.000Z"),
    });

    const result = serializeOrder(order);

    expect(result.requested_delivery_time).toBe("2026-01-02T12:00:00.000Z");
    expect(result.estimated_delivery_time).toBe("2026-01-02T12:30:00.000Z");
    expect(result.actual_delivery_time).toBe("2026-01-02T12:45:00.000Z");
  });

  it("defaults a null upi_transaction_id to an empty string", () => {
    const order = makeOrder({ upi_transaction_id: null });

    const result = serializeOrder(order);

    expect(result.upi_transaction_id).toBe("");
  });

  it("preserves a present upi_transaction_id", () => {
    const order = makeOrder({ upi_transaction_id: "UPI123456" });

    const result = serializeOrder(order);

    expect(result.upi_transaction_id).toBe("UPI123456");
  });
});

describe("serializeOrderWithDetails", () => {
  it("does not throw and returns null batch when the relation is null", () => {
    const order = makeOrderWithDetails({ batch: null });

    expect(() => serializeOrderWithDetails(order)).not.toThrow();
    expect(serializeOrderWithDetails(order).batch).toBeNull();
  });

  it("falls back to 'Unknown' name and phone when the user relation is null", () => {
    const order = makeOrderWithDetails({ user: null });

    const result = serializeOrderWithDetails(order);

    expect(result.user).toEqual({ name: "Unknown", phone: "Unknown" });
  });

  it("uses the real user's name and phone when the relation is present", () => {
    const order = makeOrderWithDetails({
      user: { id: "user_1", name: "Asha", email: "a@x.com", phone: "9999" },
    });

    const result = serializeOrderWithDetails(order);

    expect(result.user).toEqual({ name: "Asha", phone: "9999" });
  });

  it("serializes a present batch with a null delivery_status", () => {
    const order = makeOrderWithDetails({
      batch: {
        id: "batch_1",
        cutoff_time: new Date("2026-08-14T09:00:00.000Z"),
        status: "OPEN",
        delivery_status: null,
      },
    });

    const result = serializeOrderWithDetails(order);

    expect(result.batch).toEqual({
      id: "batch_1",
      cutoff_time: "2026-08-14T09:00:00.000Z",
      status: "OPEN",
      delivery_status: null,
    });
  });

  it("serializes a present batch with a present delivery_status", () => {
    const order = makeOrderWithDetails({
      batch: {
        id: "batch_1",
        cutoff_time: new Date("2026-08-14T09:00:00.000Z"),
        status: "IN_TRANSIT",
        delivery_status: {
          id: "ds_1",
          batch_id: "batch_1",
          current_milestone: "CLIMB_STARTED",
          estimated_arrival: new Date("2026-08-14T09:20:00.000Z"),
          rider_name: "Ravi",
          rider_phone: "8888",
          created_at: new Date("2026-08-14T08:55:00.000Z"),
          updated_at: new Date("2026-08-14T09:00:00.000Z"),
        },
      },
    });

    const result = serializeOrderWithDetails(order);

    expect(result.batch).toEqual({
      id: "batch_1",
      cutoff_time: "2026-08-14T09:00:00.000Z",
      status: "IN_TRANSIT",
      delivery_status: {
        id: "ds_1",
        batch_id: "batch_1",
        current_milestone: "CLIMB_STARTED",
        estimated_arrival: "2026-08-14T09:20:00.000Z",
        rider_name: "Ravi",
        rider_phone: "8888",
        created_at: "2026-08-14T08:55:00.000Z",
        updated_at: "2026-08-14T09:00:00.000Z",
      },
    });
  });

  it("maps a null estimated_arrival on delivery_status to null (not undefined)", () => {
    const order = makeOrderWithDetails({
      batch: {
        id: "batch_1",
        cutoff_time: new Date("2026-08-14T09:00:00.000Z"),
        status: "OPEN",
        delivery_status: {
          id: "ds_1",
          batch_id: "batch_1",
          current_milestone: "PACKING",
          estimated_arrival: null,
          rider_name: null,
          rider_phone: null,
          created_at: new Date("2026-08-14T08:55:00.000Z"),
          updated_at: new Date("2026-08-14T09:00:00.000Z"),
        },
      },
    });

    const result = serializeOrderWithDetails(order);

    expect(result.batch?.delivery_status?.estimated_arrival).toBeNull();
  });
});
