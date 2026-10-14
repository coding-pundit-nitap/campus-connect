import { describe, expect, it, vi } from "vitest";

import { Order, OrderItem, Prisma } from "@/generated/client";

const { Decimal } = Prisma;
import { makeProduct, makeShop } from "@tests/helpers/lib/builders";

import {
  DeliveryAddressSnapshot,
  OrderWithDetails,
  SearchResult,
} from "@/types";

import {
  createSearchNavigationHandler,
  getOrderStatusInfo,
  getPaymentStatusInfo,
  mapSearchResultsToSuggestions,
  serializeOrder,
  serializeOrderItem,
  serializeOrderWithDetails,
  serializeShop,
  transformDateToLocaleString,
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
        collective_total: new Decimal("150.00"),
        min_order_value_snapshot: new Decimal("300.00"),
        delivery_status: null,
      },
    });

    const result = serializeOrderWithDetails(order);

    expect(result.batch).toEqual({
      id: "batch_1",
      cutoff_time: "2026-08-14T09:00:00.000Z",
      status: "OPEN",
      collective_total: 150,
      min_order_value_snapshot: 300,
      delivery_status: null,
    });
  });

  it("serializes a present batch with a present delivery_status", () => {
    const order = makeOrderWithDetails({
      batch: {
        id: "batch_1",
        cutoff_time: new Date("2026-08-14T09:00:00.000Z"),
        status: "IN_TRANSIT",
        collective_total: new Decimal("450.00"),
        min_order_value_snapshot: null,
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
      collective_total: 450,
      min_order_value_snapshot: null,
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
        collective_total: new Decimal("0.00"),
        min_order_value_snapshot: null,
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

describe("serializeOrderWithDetails items", () => {
  it("serializes each item together with its product", () => {
    const order = makeOrderWithDetails({
      items: [
        {
          id: "item_1",
          quantity: 2,
          price: new Decimal("40.00"),
          order_id: "order_1",
          product_id: "product-1",
          product: {
            ...makeProduct({ price: new Decimal("40.00") }),
            category: null,
            shop: { id: "shop-1", name: "Canteen" },
          },
        },
      ] as unknown as OrderWithDetails["items"],
    });

    const [item] = serializeOrderWithDetails(order).items;

    expect(item).toMatchObject({
      id: "item_1",
      price: 40,
      quantity: 2,
      product: { id: "product-1", price: 40, rating: 0 },
    });
  });
});

describe("transformDateToLocaleString / serializeShop", () => {
  it("formats a date as an ISO string", () => {
    expect(transformDateToLocaleString(new Date(0))).toBe(
      "1970-01-01T00:00:00.000Z"
    );
  });

  it("serializes shop timestamps", () => {
    const result = serializeShop(makeShop());

    expect(result.created_at).toBe("2026-01-01T00:00:00.000Z");
    expect(result.updated_at).toBe("2026-01-01T00:00:00.000Z");
    expect(result.id).toBe("shop-1");
  });
});

const searchResult = (overrides: Partial<SearchResult>): SearchResult => ({
  id: "r1",
  title: "Title",
  subtitle: "Subtitle",
  type: "shop",
  image_key: null,
  ...overrides,
});

describe("createSearchNavigationHandler", () => {
  const setup = () => {
    const onNavigateToShop = vi.fn();
    const onNavigateToProduct = vi.fn();
    const handle = createSearchNavigationHandler({
      onNavigateToShop,
      onNavigateToProduct,
    });
    return { handle, onNavigateToShop, onNavigateToProduct };
  };

  it("navigates to a shop result", () => {
    const { handle, onNavigateToShop, onNavigateToProduct } = setup();

    handle(searchResult({ id: "s1", type: "shop" }));

    expect(onNavigateToShop).toHaveBeenCalledWith("s1");
    expect(onNavigateToProduct).not.toHaveBeenCalled();
  });

  it("navigates to a product result with its shop", () => {
    const { handle, onNavigateToProduct } = setup();

    handle(searchResult({ id: "p1", type: "product", shop_id: "s1" }));

    expect(onNavigateToProduct).toHaveBeenCalledWith("p1", "s1");
  });

  it.each(["category", "brand"] as const)("ignores %s results", (type) => {
    const { handle, onNavigateToShop, onNavigateToProduct } = setup();

    handle(searchResult({ type }));

    expect(onNavigateToShop).not.toHaveBeenCalled();
    expect(onNavigateToProduct).not.toHaveBeenCalled();
  });
});

describe("mapSearchResultsToSuggestions", () => {
  it("keeps only id, title, subtitle and type", () => {
    expect(
      mapSearchResultsToSuggestions([
        searchResult({ image_key: "x.png", shop_id: "s1" }),
      ])
    ).toEqual([
      { id: "r1", title: "Title", subtitle: "Subtitle", type: "shop" },
    ]);
  });
});

describe("getOrderStatusInfo", () => {
  it.each([
    ["NEW", "New", "text-blue-500"],
    ["BATCHED", "Batched", "text-orange-500"],
    ["OUT_FOR_DELIVERY", "Out for Delivery", "text-purple-500"],
    ["COMPLETED", "Completed", "text-green-500"],
    ["CANCELLED", "Cancelled", "text-red-500"],
    ["DELIVERY_FAILED", "Delivery Failed", "text-red-600"],
    ["RESCHEDULED", "Rescheduled", "text-yellow-500"],
  ] as const)("describes %s", (status, label, colorClassName) => {
    const info = getOrderStatusInfo(status);

    expect(info).toMatchObject({ label, colorClassName });
    expect(info.Icon).toBeDefined();
  });
});

describe("getPaymentStatusInfo", () => {
  it.each([
    ["PENDING", "Pending", "text-yellow-500"],
    ["PROCESSING", "Processing", "text-blue-500"],
    ["COMPLETED", "Paid", "text-green-500"],
    ["FAILED", "Failed", "text-red-500"],
    ["REFUNDED", "Refunded", "text-blue-500"],
    ["CANCELLED", "Cancelled", "text-gray-500"],
  ] as const)("describes %s", (status, label, colorClassName) => {
    const info = getPaymentStatusInfo(status);

    expect(info).toMatchObject({ label, colorClassName });
    expect(info.Icon).toBeDefined();
  });
});
