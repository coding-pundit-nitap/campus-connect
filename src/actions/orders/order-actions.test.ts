import { type PrismaMock } from "@tests/helpers";
import { buildBatch, buildOrder } from "@tests/helpers/actions-user/builders";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  batchRepository,
  notificationService,
  orderRepository,
  orderService,
  shopRepository,
} from "@/di/container";
import { publishBatchProgress } from "@/lib/batch-progress-publisher";
import {
  InternalServerError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/custom-error";
import { prisma } from "@/lib/prisma";
import authUtils from "@/lib/utils/auth.utils.server";
import { validateDeliveryTime } from "@/validations/order.validation";

import {
  batchUpdateOrderStatusAction,
  cancelOrderAction,
  createOrderAction,
  getOrderByIdAction,
  getOrdersAction,
  getShopOrderByIdAction,
  updateOrderStatusAction,
} from "./order-actions";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);
vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);
vi.mock("@/lib/prisma", async () => ({
  prisma: (await import("@tests/helpers")).createPrismaMock(),
}));
vi.mock("@/lib/batch-progress-publisher", () => ({
  publishBatchProgress: vi.fn(),
}));
vi.mock("@/lib/utils/order.utils", () => ({
  orderWithDetailsInclude: { items: true },
  serializeOrder: vi.fn((o: { id: string }) => ({ serialized: o.id })),
  serializeOrderWithDetails: vi.fn((o: { id: string }) => ({
    detailed: o.id,
  })),
}));
vi.mock("@/validations/order.validation", () => ({
  validateDeliveryTime: vi.fn(() => null),
}));

const auth = vi.mocked(authUtils);
const db = prisma as unknown as PrismaMock;
const orders = vi.mocked(orderRepository);
const notify = vi.mocked(notificationService.publishNotification);

describe("order-actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.getUserId.mockResolvedValue("user-1");
    auth.getOwnedShopId.mockResolvedValue("shop-1");
    notify.mockResolvedValue(undefined);
  });

  describe("getOrdersAction", () => {
    it("returns serialized orders with pagination defaults", async () => {
      vi.mocked(orderService.getOrders).mockResolvedValue({
        orders: [buildOrder()],
        total_pages: 3,
        currentPage: 1,
      } as never);

      const res = await getOrdersAction({});

      expect(orderService.getOrders).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        userId: "user-1",
      });
      expect(res.data).toEqual({
        data: [{ detailed: "order-1" }],
        total_pages: 3,
        currentPage: 1,
      });
    });

    it("passes explicit paging options through", async () => {
      vi.mocked(orderService.getOrders).mockResolvedValue({
        orders: [],
        total_pages: 0,
        currentPage: 2,
      } as never);

      await getOrdersAction({ page: 2, limit: 5 });

      expect(orderService.getOrders).toHaveBeenCalledWith({
        page: 2,
        limit: 5,
        userId: "user-1",
      });
    });

    it("throws UnauthorizedError without a user", async () => {
      auth.getUserId.mockResolvedValue("");

      await expect(getOrdersAction({})).rejects.toBeInstanceOf(
        UnauthorizedError
      );
    });

    it("rethrows UnauthenticatedError", async () => {
      auth.getUserId.mockRejectedValue(new UnauthenticatedError());

      await expect(getOrdersAction({})).rejects.toBeInstanceOf(
        UnauthenticatedError
      );
    });

    it("wraps unexpected errors", async () => {
      vi.mocked(orderService.getOrders).mockRejectedValue(new Error("db"));

      await expect(getOrdersAction({})).rejects.toThrow(
        new InternalServerError("Failed to retrieve orders.")
      );
    });
  });

  describe("createOrderAction", () => {
    const shop = {
      id: "shop-1",
      is_active: true,
      accepting_orders: true,
      opening: "09:00",
      closing: "21:00",
    };
    const input = {
      shop_id: "shop-1",
      payment_method: "CASH" as const,
      delivery_address_id: "addr-1",
    };

    beforeEach(() => {
      vi.mocked(shopRepository.findById).mockResolvedValue(shop as never);
      vi.mocked(orderService.createOrderFromCart).mockResolvedValue(
        buildOrder() as never
      );
    });

    it("creates an offline-paid order from the cart", async () => {
      const res = await createOrderAction(input);

      expect(res).toMatchObject({
        success: true,
        data: { serialized: "order-1" },
        details: "Order placed successfully!",
      });
      const args = vi.mocked(orderService.createOrderFromCart).mock.calls[0];
      expect(args.slice(0, 4)).toEqual(["user-1", "shop-1", "CASH", "addr-1"]);
      expect(args[4]).toMatch(/^offline_\d+_[0-9a-f-]{8}$/);
    });

    it("uses a txn_ payment id for online payments", async () => {
      await createOrderAction({ ...input, payment_method: "ONLINE" });

      const args = vi.mocked(orderService.createOrderFromCart).mock.calls[0];
      expect(args[4]).toMatch(/^txn_/);
    });

    it("validates and forwards the requested delivery time", async () => {
      const when = new Date("2026-01-01T12:00:00.000Z");

      await createOrderAction({
        ...input,
        requested_delivery_time: when,
        upi_transaction_id: "upi",
        customer_notes: "notes",
        batch_id: "batch-1",
      });

      expect(validateDeliveryTime).toHaveBeenCalledWith(when, "09:00", "21:00");
      const args = vi.mocked(orderService.createOrderFromCart).mock.calls[0];
      expect(args.slice(5)).toEqual([
        when,
        "upi",
        "notes",
        undefined,
        "batch-1",
      ]);
    });

    it("ignores the delivery time for direct delivery", async () => {
      await createOrderAction({
        ...input,
        is_direct_delivery: true,
        requested_delivery_time: new Date(),
      });

      expect(validateDeliveryTime).not.toHaveBeenCalled();
      const args = vi.mocked(orderService.createOrderFromCart).mock.calls[0];
      expect(args[5]).toBeUndefined();
      expect(args[8]).toBe(true);
    });

    it.each([
      [
        "no user",
        () => auth.getUserId.mockResolvedValue(""),
        "Unauthorized: Please log in.",
      ],
      [
        "missing shop",
        () => vi.mocked(shopRepository.findById).mockResolvedValue(null),
        "Shop not found or no longer available.",
      ],
      [
        "inactive shop",
        () =>
          vi
            .mocked(shopRepository.findById)
            .mockResolvedValue({ ...shop, is_active: false } as never),
        "Shop is currently not accepting orders.",
      ],
      [
        "paused shop",
        () =>
          vi
            .mocked(shopRepository.findById)
            .mockResolvedValue({ ...shop, accepting_orders: false } as never),
        "Shop is not accepting orders at the moment. Please try again later.",
      ],
    ])("returns an error response for %s", async (_case, arrange, message) => {
      arrange();

      const res = await createOrderAction(input);

      expect(res).toMatchObject({ success: false, details: message });
      expect(orderService.createOrderFromCart).not.toHaveBeenCalled();
    });

    it("rejects an invalid delivery time", async () => {
      const res = await createOrderAction({
        ...input,
        requested_delivery_time: new Date("nope"),
      });

      expect(res).toMatchObject({
        success: false,
        details: "Invalid delivery time.",
      });
    });

    it("returns the delivery-time validation message", async () => {
      vi.mocked(validateDeliveryTime).mockReturnValueOnce("Shop closed");

      const res = await createOrderAction({
        ...input,
        requested_delivery_time: new Date(),
      });

      expect(res).toMatchObject({ success: false, details: "Shop closed" });
    });

    it.each([
      new ValidationError("bad cart"),
      new NotFoundError("no cart"),
      new UnauthorizedError("no"),
      new UnauthenticatedError("login"),
      new Error("generic"),
    ])("returns the message of a thrown %s", async (error) => {
      vi.mocked(orderService.createOrderFromCart).mockRejectedValue(error);

      const res = await createOrderAction(input);

      expect(res).toMatchObject({ success: false, details: error.message });
    });

    it("returns a generic message for non-Error throws", async () => {
      vi.mocked(orderService.createOrderFromCart).mockRejectedValue("boom");

      const res = await createOrderAction(input);

      expect(res).toMatchObject({
        success: false,
        details: "Failed to create order.",
      });
    });
  });

  describe("updateOrderStatusAction", () => {
    beforeEach(() => {
      db.order.update.mockResolvedValue({ id: "order-1", total_price: "99.5" });
    });

    it("updates the status and notifies the customer", async () => {
      orders.getOrderById.mockResolvedValue(
        buildOrder({ order_status: "BATCHED" }) as never
      );

      const res = await updateOrderStatusAction({
        order_id: "order-1",
        status: "OUT_FOR_DELIVERY",
      });

      expect(db.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: {
          order_status: "OUT_FOR_DELIVERY",
          payment_status: undefined,
          actual_delivery_time: undefined,
        },
      });
      expect(res.data).toEqual({ id: "order-1", total_price: 99.5 });
      expect(res.details).toBe("Order status updated to OUT_FOR_DELIVERY");
      expect(notify).toHaveBeenCalledWith("user-1", {
        title: "🚀 Order Out for Delivery!",
        message: "Your order ORD-1 is out for delivery.",
        type: "SUCCESS",
        action_url: "/orders/order-1",
        category: "ORDER",
      });
      expect(batchRepository.adjustCollectiveTotal).not.toHaveBeenCalled();
    });

    it("completes a cash order with a delivery time and completed payment", async () => {
      orders.getOrderById.mockResolvedValue(
        buildOrder({ order_status: "OUT_FOR_DELIVERY" }) as never
      );

      await updateOrderStatusAction({
        order_id: "order-1",
        status: "COMPLETED",
      });

      expect(db.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: expect.objectContaining({
          payment_status: "COMPLETED",
          actual_delivery_time: expect.any(Date),
        }),
      });
    });

    it("cancels a batched order, decrements the batch and publishes progress", async () => {
      orders.getOrderById.mockResolvedValue(
        buildOrder({ batch_id: "batch-1", payment_method: "ONLINE" }) as never
      );
      vi.mocked(batchRepository.adjustCollectiveTotal).mockResolvedValue(
        buildBatch() as never
      );

      await updateOrderStatusAction({
        order_id: "order-1",
        status: "CANCELLED",
      });

      expect(db.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: expect.objectContaining({ payment_status: "REFUNDED" }),
      });
      expect(batchRepository.adjustCollectiveTotal).toHaveBeenCalledWith(
        "batch-1",
        -200,
        db
      );
      expect(publishBatchProgress).toHaveBeenCalledWith(
        expect.objectContaining({ batchId: "batch-1", collectiveTotal: 100 })
      );
    });

    it("does not adjust any batch when cancelling an unbatched order", async () => {
      orders.getOrderById.mockResolvedValue(buildOrder() as never);

      await updateOrderStatusAction({
        order_id: "order-1",
        status: "CANCELLED",
      });

      expect(batchRepository.adjustCollectiveTotal).not.toHaveBeenCalled();
      expect(publishBatchProgress).not.toHaveBeenCalled();
    });

    it("skips the notification for guest orders", async () => {
      orders.getOrderById.mockResolvedValue(
        buildOrder({ user_id: null }) as never
      );

      await updateOrderStatusAction({ order_id: "order-1", status: "BATCHED" });

      expect(notify).not.toHaveBeenCalled();
    });

    it("still succeeds when the notification fails", async () => {
      orders.getOrderById.mockResolvedValue(buildOrder() as never);
      notify.mockRejectedValue(new Error("queue"));

      const res = await updateOrderStatusAction({
        order_id: "order-1",
        status: "BATCHED",
      });

      expect(res.success).toBe(true);
    });

    it("throws UnauthorizedError when the order belongs to another shop", async () => {
      orders.getOrderById.mockResolvedValue(
        buildOrder({ shop_id: "other" }) as never
      );

      await expect(
        updateOrderStatusAction({ order_id: "order-1", status: "BATCHED" })
      ).rejects.toThrow(
        new UnauthorizedError(
          "Unauthorized: Order does not belong to your shop."
        )
      );
    });

    it("throws UnauthorizedError when the order does not exist", async () => {
      orders.getOrderById.mockResolvedValue(null);

      await expect(
        updateOrderStatusAction({ order_id: "order-1", status: "BATCHED" })
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it.each([
      ["NEW", "COMPLETED"],
      ["UNKNOWN_STATUS", "BATCHED"],
    ])("rejects the transition %s -> %s", async (from, to) => {
      orders.getOrderById.mockResolvedValue(
        buildOrder({ order_status: from }) as never
      );

      await expect(
        updateOrderStatusAction({ order_id: "order-1", status: to as never })
      ).rejects.toThrow(
        new ValidationError(`Invalid status transition from ${from} to ${to}`)
      );
    });

    it("wraps unexpected errors", async () => {
      orders.getOrderById.mockRejectedValue(new Error("db"));

      await expect(
        updateOrderStatusAction({ order_id: "order-1", status: "BATCHED" })
      ).rejects.toThrow(
        new InternalServerError("Failed to update order status.")
      );
    });
  });

  describe.each([
    ["getOrderByIdAction", getOrderByIdAction, { user_id: "other" }],
    ["getShopOrderByIdAction", getShopOrderByIdAction, { shop_id: "other" }],
  ])("%s", (_name, action, foreignOwner) => {
    it("returns the serialized order with details", async () => {
      orders.getOrderById.mockResolvedValue(buildOrder() as never);

      const res = await action("order-1");

      expect(orders.getOrderById).toHaveBeenCalledWith("order-1", {
        include: { items: true },
      });
      expect(res.data).toEqual({ detailed: "order-1" });
    });

    it("throws NotFoundError for a missing order", async () => {
      orders.getOrderById.mockResolvedValue(null);

      await expect(action("order-1")).rejects.toThrow(
        new NotFoundError("Order not found.")
      );
    });

    it("throws NotFoundError for an order owned by someone else", async () => {
      orders.getOrderById.mockResolvedValue(buildOrder(foreignOwner) as never);

      await expect(action("order-1")).rejects.toBeInstanceOf(NotFoundError);
    });

    it("rethrows UnauthenticatedError", async () => {
      auth.getUserId.mockRejectedValue(new UnauthenticatedError());
      auth.getOwnedShopId.mockRejectedValue(new UnauthenticatedError());

      await expect(action("order-1")).rejects.toBeInstanceOf(
        UnauthenticatedError
      );
    });

    it("wraps unexpected errors", async () => {
      orders.getOrderById.mockRejectedValue(new Error("db"));

      await expect(action("order-1")).rejects.toThrow(
        new InternalServerError("Failed to retrieve order details.")
      );
    });
  });

  it("getOrderByIdAction requires a logged-in user", async () => {
    auth.getUserId.mockResolvedValue("");

    await expect(getOrderByIdAction("order-1")).rejects.toThrow(
      new UnauthorizedError("Unauthorized: Please log in.")
    );
  });

  it("getShopOrderByIdAction requires a shop owner", async () => {
    auth.getOwnedShopId.mockResolvedValue("");

    await expect(getShopOrderByIdAction("order-1")).rejects.toThrow(
      new UnauthorizedError("Unauthorized: You do not own a shop.")
    );
  });

  describe("cancelOrderAction", () => {
    it("cancels the order and notifies the user", async () => {
      orders.getOrderById.mockResolvedValue(buildOrder() as never);

      const res = await cancelOrderAction("order-1");

      expect(orders.updateStatus).toHaveBeenCalledWith(
        "order-1",
        "CANCELLED",
        undefined,
        undefined,
        db
      );
      expect(batchRepository.adjustCollectiveTotal).not.toHaveBeenCalled();
      expect(publishBatchProgress).not.toHaveBeenCalled();
      expect(notify).toHaveBeenCalledWith("user-1", {
        title: "Order Cancelled",
        message: "Your order ORD-1 has been cancelled.",
        action_url: "/orders/order-1",
        type: "WARNING",
      });
      expect(res).toMatchObject({
        success: true,
        data: null,
        details: "Order cancelled successfully.",
      });
    });

    it("decrements the batch total and publishes progress for batched orders", async () => {
      orders.getOrderById.mockResolvedValue(
        buildOrder({ batch_id: "batch-1" }) as never
      );
      vi.mocked(batchRepository.adjustCollectiveTotal).mockResolvedValue(
        buildBatch() as never
      );

      await cancelOrderAction("order-1");

      expect(batchRepository.adjustCollectiveTotal).toHaveBeenCalledWith(
        "batch-1",
        -200,
        db
      );
      expect(publishBatchProgress).toHaveBeenCalledTimes(1);
    });

    it("succeeds even when the notification fails", async () => {
      orders.getOrderById.mockResolvedValue(buildOrder() as never);
      notify.mockRejectedValue(new Error("queue"));

      await expect(cancelOrderAction("order-1")).resolves.toMatchObject({
        success: true,
      });
    });

    it.each([
      [
        "no user",
        () => auth.getUserId.mockResolvedValue(""),
        UnauthorizedError,
      ],
      [
        "missing order",
        () => orders.getOrderById.mockResolvedValue(null),
        UnauthorizedError,
      ],
      [
        "foreign order",
        () =>
          orders.getOrderById.mockResolvedValue(
            buildOrder({ user_id: "other" }) as never
          ),
        UnauthorizedError,
      ],
      [
        "non-NEW order",
        () =>
          orders.getOrderById.mockResolvedValue(
            buildOrder({ order_status: "BATCHED" }) as never
          ),
        ValidationError,
      ],
      [
        "paid order",
        () =>
          orders.getOrderById.mockResolvedValue(
            buildOrder({ payment_status: "COMPLETED" }) as never
          ),
        ValidationError,
      ],
      [
        "unauthenticated caller",
        () => auth.getUserId.mockRejectedValue(new UnauthenticatedError()),
        UnauthenticatedError,
      ],
      [
        "database failure",
        () => orders.getOrderById.mockRejectedValue(new Error("db")),
        InternalServerError,
      ],
    ])("rejects a %s", async (_case, arrange, ErrorType) => {
      arrange();

      await expect(cancelOrderAction("order-1")).rejects.toBeInstanceOf(
        ErrorType
      );
      expect(orders.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe("batchUpdateOrderStatusAction", () => {
    const run = (status: string, orderIds = ["o1", "o2"]) =>
      batchUpdateOrderStatusAction({ orderIds, status: status as never });

    it("updates every order whose status changes and notifies their users", async () => {
      orders.getOrdersByIds.mockResolvedValue([
        buildOrder({ id: "o1", display_id: "D1", order_status: "BATCHED" }),
        buildOrder({
          id: "o2",
          display_id: "D2",
          order_status: "OUT_FOR_DELIVERY",
        }),
        buildOrder({
          id: "o3",
          order_status: "OUT_FOR_DELIVERY",
          user_id: null,
        }),
      ] as never);

      const res = await run("OUT_FOR_DELIVERY");

      expect(db.order.update).toHaveBeenCalledTimes(1);
      expect(db.order.update).toHaveBeenCalledWith({
        where: { id: "o1" },
        data: {
          order_status: "OUT_FOR_DELIVERY",
          payment_status: undefined,
          actual_delivery_time: undefined,
        },
      });
      expect(db.batch.update).not.toHaveBeenCalled();
      expect(notify).toHaveBeenCalledTimes(1);
      expect(notify).toHaveBeenCalledWith(
        "user-1",
        expect.objectContaining({ action_url: "/orders/o1", category: "ORDER" })
      );
      expect(res.details).toBe(
        "Successfully updated 1 orders to OUT_FOR_DELIVERY"
      );
    });

    it("completes orders with a delivery time", async () => {
      orders.getOrdersByIds.mockResolvedValue([
        buildOrder({ id: "o1", order_status: "OUT_FOR_DELIVERY" }),
      ] as never);

      await run("COMPLETED");

      expect(db.order.update).toHaveBeenCalledWith({
        where: { id: "o1" },
        data: expect.objectContaining({
          payment_status: "COMPLETED",
          actual_delivery_time: expect.any(Date),
        }),
      });
    });

    it("cancels orders, decrements their batches and publishes each batch once", async () => {
      orders.getOrdersByIds.mockResolvedValue([
        buildOrder({ id: "o1", batch_id: "b1", item_total: 30 }),
        buildOrder({ id: "o2", batch_id: "b1", item_total: 20 }),
        buildOrder({ id: "o3", batch_id: null }),
      ] as never);
      db.batch.findMany.mockResolvedValue([buildBatch({ id: "b1" })]);

      await run("CANCELLED");

      expect(db.order.update).toHaveBeenCalledTimes(3);
      expect(db.batch.update).toHaveBeenCalledWith({
        where: { id: "b1" },
        data: { collective_total: { decrement: 30 } },
      });
      expect(db.batch.update).toHaveBeenCalledWith({
        where: { id: "b1" },
        data: { collective_total: { decrement: 20 } },
      });
      expect(db.batch.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: { in: ["b1"] } } })
      );
      expect(publishBatchProgress).toHaveBeenCalledTimes(1);
    });

    it("does not query batches when no cancelled order was batched", async () => {
      orders.getOrdersByIds.mockResolvedValue([buildOrder()] as never);

      await run("CANCELLED");

      expect(db.batch.findMany).not.toHaveBeenCalled();
    });

    it("does nothing when every order already has the status", async () => {
      orders.getOrdersByIds.mockResolvedValue([
        buildOrder({ order_status: "BATCHED" }),
      ] as never);

      const res = await run("BATCHED");

      expect(db.$transaction).not.toHaveBeenCalled();
      expect(notify).not.toHaveBeenCalled();
      expect(res.details).toBe("Successfully updated 0 orders to BATCHED");
    });

    it("lists every invalid transition", async () => {
      orders.getOrdersByIds.mockResolvedValue([
        buildOrder({ display_id: "D1", order_status: "COMPLETED" }),
        buildOrder({ display_id: "D2", order_status: "WEIRD" }),
      ] as never);

      await expect(run("BATCHED")).rejects.toThrow(
        new ValidationError(
          "Invalid status transitions: D1: COMPLETED → BATCHED, D2: WEIRD → BATCHED"
        )
      );
      expect(db.$transaction).not.toHaveBeenCalled();
    });

    it("rejects orders of another shop", async () => {
      orders.getOrdersByIds.mockResolvedValue([
        buildOrder({ shop_id: "other" }),
      ] as never);

      await expect(run("BATCHED")).rejects.toThrow(
        new UnauthorizedError(
          "Unauthorized: One or more orders do not belong to your shop."
        )
      );
    });

    it("requires a shop owner", async () => {
      auth.getOwnedShopId.mockResolvedValue("");

      await expect(run("BATCHED")).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it("wraps unexpected errors", async () => {
      orders.getOrdersByIds.mockRejectedValue(new Error("db"));

      await expect(run("BATCHED")).rejects.toThrow(
        new InternalServerError("Failed to update order statuses.")
      );
    });
  });
});
