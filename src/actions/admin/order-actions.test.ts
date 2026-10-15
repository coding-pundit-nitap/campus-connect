import type { PrismaMock } from "@tests/helpers";
import {
  asAdmin,
  CURSOR,
  itGuardsAdminAccess,
  rows,
} from "@tests/helpers/actions-admin";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  batchRepository,
  notificationService,
  orderRepository,
} from "@/di/container";
import { publishBatchProgress } from "@/lib/batch-progress-publisher";
import { BadRequestError, NotFoundError } from "@/lib/custom-error";
import { prisma } from "@/lib/prisma";

import {
  getAllOrdersAction,
  getOrderStatsAction,
  updateOrderStatusAdminAction,
  updatePaymentStatusAction,
} from "./order-actions";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers/actions-admin/mocks")).adminContainerModule()
);
vi.mock("@/lib/verify-admin", async () =>
  (await import("@tests/helpers/actions-admin/mocks")).verifyAdminModule()
);
vi.mock("@/lib/prisma", async () => ({
  prisma: (await import("@tests/helpers")).createPrismaMock(),
}));
vi.mock("@/lib/batch-progress-publisher", () => ({
  publishBatchProgress: vi.fn(),
}));
vi.mock("@/lib/utils/order.utils", () => ({
  orderWithDetailsInclude: { include: "details" },
  serializeOrderWithDetails: (o: { id: string }) => ({
    ...o,
    serialized: true,
  }),
}));

const orders = vi.mocked(orderRepository);
const tx = prisma as unknown as PrismaMock;
const notify = vi.mocked(notificationService.publishNotification);

const order = (overrides: Record<string, unknown> = {}) =>
  ({
    id: "order-1",
    display_id: "D-1",
    user_id: "user-1",
    order_status: "NEW",
    payment_status: "PENDING",
    batch_id: null,
    item_total: 150,
    ...overrides,
  }) as never;

describe("admin order actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asAdmin();
  });

  describe("getAllOrdersAction", () => {
    itGuardsAdminAccess(
      () => getAllOrdersAction({ limit: 10 }),
      "Failed to retrieve orders."
    );

    it("returns serialized orders without filters", async () => {
      orders.findMany.mockResolvedValue(rows(1, "o") as never);

      const res = await getAllOrdersAction({ limit: 10 });

      const arg = orders.findMany.mock.calls[0][0] as { where: object };
      expect(arg.where).toStrictEqual({});
      expect(orders.findMany).toHaveBeenCalledWith({
        where: {},
        take: 11,
        skip: 0,
        cursor: undefined,
        orderBy: [{ created_at: "desc" }, { id: "desc" }],
        include: { include: "details" },
      });
      expect(res.data).toEqual({
        data: [{ id: "o-1", serialized: true }],
        nextCursor: null,
        hasMore: false,
      });
    });

    it("applies every filter and the cursor", async () => {
      orders.findMany.mockResolvedValue(rows(2, "o") as never);

      const res = await getAllOrdersAction({
        limit: 1,
        cursor: CURSOR,
        search: "D-1",
        order_status: "NEW",
        payment_status: "COMPLETED",
        shop_id: "shop-1",
      });

      expect(orders.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { display_id: { contains: "D-1", mode: "insensitive" } },
              { user: { name: { contains: "D-1", mode: "insensitive" } } },
              { user: { email: { contains: "D-1", mode: "insensitive" } } },
            ],
            order_status: "NEW",
            payment_status: "COMPLETED",
            shop_id: "shop-1",
          },
          cursor: { id: CURSOR },
        })
      );
      expect(res.data?.nextCursor).toBe("o-1");
    });

    it("rejects invalid options with BadRequestError", async () => {
      await expect(
        getAllOrdersAction({ limit: 10, order_status: "NOPE" as never })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("updateOrderStatusAdminAction", () => {
    itGuardsAdminAccess(
      () =>
        updateOrderStatusAdminAction({
          order_id: "order-1",
          order_status: "BATCHED",
        }),
      "Failed to update order status."
    );

    beforeEach(() => {
      tx.order.update.mockImplementation(async ({ data }) => ({
        id: "order-1",
        display_id: "D-1",
        order_status: data.order_status,
      }));
    });

    it("updates the status and notifies the customer", async () => {
      orders.findById.mockResolvedValue(order());

      const res = await updateOrderStatusAdminAction({
        order_id: "order-1",
        order_status: "BATCHED",
      });

      expect(tx.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: { order_status: "BATCHED" },
      });
      expect(batchRepository.adjustCollectiveTotal).not.toHaveBeenCalled();
      expect(publishBatchProgress).not.toHaveBeenCalled();
      expect(notify).toHaveBeenCalledWith("user-1", {
        title: "Order Status Updated",
        message: "Your order #D-1 is being prepared.",
        type: "INFO",
        category: "ORDER",
        action_url: "/orders/order-1",
      });
      expect(res.data).toEqual({
        id: "order-1",
        display_id: "D-1",
        order_status: "BATCHED",
      });
    });

    it("stores the ETA when going out for delivery", async () => {
      orders.findById.mockResolvedValue(order());
      const eta = new Date("2026-05-01T10:00:00Z");

      await updateOrderStatusAdminAction({
        order_id: "order-1",
        order_status: "OUT_FOR_DELIVERY",
        estimated_delivery_time: eta,
      });

      expect(tx.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: {
          order_status: "OUT_FOR_DELIVERY",
          estimated_delivery_time: eta,
        },
      });
    });

    it("ignores a missing ETA when going out for delivery", async () => {
      orders.findById.mockResolvedValue(order());

      await updateOrderStatusAdminAction({
        order_id: "order-1",
        order_status: "OUT_FOR_DELIVERY",
      });

      expect(tx.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: { order_status: "OUT_FOR_DELIVERY" },
      });
    });

    it("stamps the delivery time and sends a success notice on completion", async () => {
      orders.findById.mockResolvedValue(order());

      await updateOrderStatusAdminAction({
        order_id: "order-1",
        order_status: "COMPLETED",
      });

      expect(tx.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: {
          order_status: "COMPLETED",
          actual_delivery_time: expect.any(Date),
        },
      });
      expect(notify).toHaveBeenCalledWith(
        "user-1",
        expect.objectContaining({ type: "SUCCESS" })
      );
    });

    it("removes a cancelled batched order from the batch total and publishes progress", async () => {
      orders.findById.mockResolvedValue(order({ batch_id: "batch-1" }));
      vi.mocked(batchRepository.adjustCollectiveTotal).mockResolvedValue({
        id: "batch-1",
        shop_id: "shop-1",
        status: "OPEN",
        collective_total: 350,
        min_order_value_snapshot: 500,
      } as never);

      await updateOrderStatusAdminAction({
        order_id: "order-1",
        order_status: "CANCELLED",
      });

      expect(batchRepository.adjustCollectiveTotal).toHaveBeenCalledWith(
        "batch-1",
        -150,
        tx
      );
      expect(publishBatchProgress).toHaveBeenCalledWith({
        batchId: "batch-1",
        shopId: "shop-1",
        status: "OPEN",
        collectiveTotal: 350,
        minRequired: 500,
      });
      expect(notify).toHaveBeenCalledWith(
        "user-1",
        expect.objectContaining({ type: "ERROR" })
      );
    });

    it("publishes a null minimum when the batch has no snapshot", async () => {
      orders.findById.mockResolvedValue(order({ batch_id: "batch-1" }));
      vi.mocked(batchRepository.adjustCollectiveTotal).mockResolvedValue({
        id: "batch-1",
        shop_id: "shop-1",
        status: "OPEN",
        collective_total: 0,
        min_order_value_snapshot: null,
      } as never);

      await updateOrderStatusAdminAction({
        order_id: "order-1",
        order_status: "CANCELLED",
      });

      expect(publishBatchProgress).toHaveBeenCalledWith(
        expect.objectContaining({ minRequired: null })
      );
    });

    it.each([
      ["already cancelled", { batch_id: "batch-1", order_status: "CANCELLED" }],
      ["not batched", { batch_id: null }],
    ])(
      "does not touch the batch total when the order is %s",
      async (_name, overrides) => {
        orders.findById.mockResolvedValue(order(overrides));

        await updateOrderStatusAdminAction({
          order_id: "order-1",
          order_status: "CANCELLED",
        });

        expect(batchRepository.adjustCollectiveTotal).not.toHaveBeenCalled();
        expect(publishBatchProgress).not.toHaveBeenCalled();
      }
    );

    it("adds a reverted cancelled order back to the batch total and publishes progress", async () => {
      // Regression: reverting a cancellation left the batch total too low.
      orders.findById.mockResolvedValue(
        order({ batch_id: "batch-1", order_status: "CANCELLED" })
      );
      vi.mocked(batchRepository.adjustCollectiveTotal).mockResolvedValue({
        id: "batch-1",
        shop_id: "shop-1",
        status: "OPEN",
        collective_total: 500,
        min_order_value_snapshot: 500,
      } as never);

      await updateOrderStatusAdminAction({
        order_id: "order-1",
        order_status: "BATCHED",
      });

      expect(batchRepository.adjustCollectiveTotal).toHaveBeenCalledWith(
        "batch-1",
        150,
        tx
      );
      expect(publishBatchProgress).toHaveBeenCalledWith({
        batchId: "batch-1",
        shopId: "shop-1",
        status: "OPEN",
        collectiveTotal: 500,
        minRequired: 500,
      });
    });

    it("does not touch any batch when reverting an unbatched cancelled order", async () => {
      orders.findById.mockResolvedValue(
        order({ batch_id: null, order_status: "CANCELLED" })
      );

      await updateOrderStatusAdminAction({
        order_id: "order-1",
        order_status: "NEW",
      });

      expect(batchRepository.adjustCollectiveTotal).not.toHaveBeenCalled();
      expect(publishBatchProgress).not.toHaveBeenCalled();
    });

    it("leaves the batch total alone for active-to-active transitions", async () => {
      orders.findById.mockResolvedValue(order({ batch_id: "batch-1" }));

      await updateOrderStatusAdminAction({
        order_id: "order-1",
        order_status: "OUT_FOR_DELIVERY",
      });

      expect(batchRepository.adjustCollectiveTotal).not.toHaveBeenCalled();
    });

    it("loads the order with its user and shop", async () => {
      orders.findById.mockResolvedValue(order());

      await updateOrderStatusAdminAction({
        order_id: "order-1",
        order_status: "BATCHED",
      });

      expect(orders.findById).toHaveBeenCalledWith("order-1", {
        include: { user: true, shop: true },
      });
    });

    it.each([
      [
        "cancelling an online order refunds it",
        "CANCELLED",
        { payment_method: "ONLINE" },
        "REFUNDED",
      ],
      [
        "cancelling a paid cash order refunds it",
        "CANCELLED",
        { payment_method: "CASH", payment_status: "COMPLETED" },
        "REFUNDED",
      ],
      [
        "cancelling an unpaid cash order cancels the payment",
        "CANCELLED",
        { payment_method: "CASH" },
        "CANCELLED",
      ],
      [
        "completing a cash order marks it paid",
        "COMPLETED",
        { payment_method: "CASH" },
        "COMPLETED",
      ],
    ] as const)(
      "payment follows the order: %s",
      async (_n, status, overrides, expected) => {
        orders.findById.mockResolvedValue(order(overrides));

        await updateOrderStatusAdminAction({
          order_id: "order-1",
          order_status: status,
        });

        expect(tx.order.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ payment_status: expected }),
          })
        );
      }
    );

    it.each([
      [
        "completing an online order",
        "COMPLETED",
        { payment_method: "ONLINE", order_status: "NEW" },
      ],
      [
        "a non-terminal transition",
        "BATCHED",
        { payment_method: "CASH", order_status: "NEW" },
      ],
      [
        "re-saving COMPLETED",
        "COMPLETED",
        {
          payment_method: "CASH",
          order_status: "COMPLETED",
          payment_status: "PENDING",
        },
      ],
      [
        "re-saving CANCELLED",
        "CANCELLED",
        {
          payment_method: "ONLINE",
          order_status: "CANCELLED",
          payment_status: "COMPLETED",
        },
      ],
    ] as const)(
      "does not write payment_status for %s",
      async (_n, status, overrides) => {
        orders.findById.mockResolvedValue(order(overrides));

        await updateOrderStatusAdminAction({
          order_id: "order-1",
          order_status: status,
        });

        const { data } = tx.order.update.mock.calls[0][0] as { data: object };
        expect(data).not.toHaveProperty("payment_status");
      }
    );

    it("does not store an ETA for a status other than OUT_FOR_DELIVERY", async () => {
      orders.findById.mockResolvedValue(order());

      await updateOrderStatusAdminAction({
        order_id: "order-1",
        order_status: "BATCHED",
        estimated_delivery_time: new Date("2026-05-01T10:00:00Z"),
      });

      const { data } = tx.order.update.mock.calls[0][0] as { data: object };
      expect(data).not.toHaveProperty("estimated_delivery_time");
    });

    it("reports the new status in the success message", async () => {
      orders.findById.mockResolvedValue(order());

      const res = await updateOrderStatusAdminAction({
        order_id: "order-1",
        order_status: "BATCHED",
      });

      expect(res.details).toBe(
        "Successfully updated order #D-1 status to BATCHED"
      );
    });

    it.each([
      ["NEW", "has been received"],
      ["BATCHED", "is being prepared"],
      ["OUT_FOR_DELIVERY", "is out for delivery"],
      ["DELIVERY_FAILED", "failed to be delivered"],
      ["COMPLETED", "has been completed"],
      ["CANCELLED", "has been cancelled"],
      ["RESCHEDULED", "has been rescheduled"],
    ] as const)(
      "notifies with the %s status wording",
      async (status, wording) => {
        orders.findById.mockResolvedValue(order({ order_status: "BATCHED" }));

        await updateOrderStatusAdminAction({
          order_id: "order-1",
          order_status: status,
        });

        expect(notify).toHaveBeenCalledWith(
          "user-1",
          expect.objectContaining({ message: `Your order #D-1 ${wording}.` })
        );
      }
    );

    it("updates the order with the exact values on payment status", async () => {
      orders.findById.mockResolvedValue(order());
      orders.update.mockResolvedValue(order());

      const res = await updatePaymentStatusAction({
        order_id: "order-1",
        payment_status: "COMPLETED",
      });

      expect(orders.findById).toHaveBeenCalledWith("order-1", {
        include: { user: true },
      });
      expect(notify).toHaveBeenCalledWith("user-1", {
        title: "Payment Status Updated",
        message: "Payment status for order #D-1 has been updated to COMPLETED.",
        type: "SUCCESS",
        category: "ORDER",
        action_url: "/orders/order-1",
      });
      expect(res.details).toBe(
        "Successfully updated payment status for order #D-1"
      );
    });

    it("skips the notification for guest orders", async () => {
      orders.findById.mockResolvedValue(order({ user_id: null }));

      await updateOrderStatusAdminAction({
        order_id: "order-1",
        order_status: "BATCHED",
      });

      expect(notify).not.toHaveBeenCalled();
    });

    it("rejects invalid input with BadRequestError", async () => {
      await expect(
        updateOrderStatusAdminAction({
          order_id: "order-1",
          order_status: "NOPE" as never,
        })
      ).rejects.toThrow(BadRequestError);
      expect(orders.findById).not.toHaveBeenCalled();
    });

    it("throws NotFoundError for an unknown order", async () => {
      orders.findById.mockResolvedValue(null);

      await expect(
        updateOrderStatusAdminAction({
          order_id: "order-1",
          order_status: "BATCHED",
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("updatePaymentStatusAction", () => {
    itGuardsAdminAccess(
      () =>
        updatePaymentStatusAction({
          order_id: "order-1",
          payment_status: "COMPLETED",
        }),
      "Failed to update payment status."
    );

    it.each([
      ["COMPLETED", "SUCCESS"],
      ["FAILED", "ERROR"],
      ["PENDING", "INFO"],
    ] as const)(
      "sets %s and notifies with type %s",
      async (payment_status, type) => {
        orders.findById.mockResolvedValue(order());
        orders.update.mockResolvedValue(order({ payment_status }));

        const res = await updatePaymentStatusAction({
          order_id: "order-1",
          payment_status,
        });

        expect(orders.update).toHaveBeenCalledWith("order-1", {
          payment_status,
        });
        expect(notify).toHaveBeenCalledWith(
          "user-1",
          expect.objectContaining({
            type,
            message: `Payment status for order #D-1 has been updated to ${payment_status}.`,
          })
        );
        expect(res.data).toEqual({
          id: "order-1",
          display_id: "D-1",
          payment_status,
        });
      }
    );

    it("skips the notification for guest orders", async () => {
      orders.findById.mockResolvedValue(order({ user_id: null }));
      orders.update.mockResolvedValue(order());

      await updatePaymentStatusAction({
        order_id: "order-1",
        payment_status: "COMPLETED",
      });

      expect(notify).not.toHaveBeenCalled();
    });

    it("rejects an empty order id with BadRequestError", async () => {
      await expect(
        updatePaymentStatusAction({ order_id: "", payment_status: "PENDING" })
      ).rejects.toThrow(BadRequestError);
    });

    it("throws NotFoundError for an unknown order", async () => {
      orders.findById.mockResolvedValue(null);

      await expect(
        updatePaymentStatusAction({
          order_id: "order-1",
          payment_status: "PENDING",
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("getOrderStatsAction", () => {
    itGuardsAdminAccess(
      () => getOrderStatsAction(),
      "Failed to retrieve order statistics."
    );

    it("aggregates counts and sums today's completed revenue", async () => {
      [20, 3, 4, 10, 2, 5, 7].forEach((n) =>
        orders.count.mockResolvedValueOnce(n)
      );
      orders.findMany.mockResolvedValue([
        { total_price: "100.50" },
        { total_price: 49.5 },
      ] as never);

      vi.useFakeTimers({
        toFake: ["Date"],
        now: new Date("2026-08-12T20:00:00Z"),
      });
      const res = await getOrderStatsAction();
      vi.useRealTimers();

      const counts = orders.count.mock.calls.map((c) => c[0]);
      expect(counts).toStrictEqual([
        undefined,
        { where: { order_status: "NEW" } },
        { where: { order_status: "BATCHED" } },
        { where: { order_status: "COMPLETED" } },
        { where: { order_status: "CANCELLED" } },
        { where: { payment_status: "PENDING" } },
        {
          where: { created_at: { gte: new Date("2026-08-05T20:00:00.000Z") } },
        },
      ]);
      expect(orders.findMany).toHaveBeenCalledWith({
        where: {
          created_at: { gte: new Date("2026-08-12T18:30:00.000Z") },
          order_status: "COMPLETED",
        },
        select: { total_price: true },
      });
      expect(res.details).toBe("Order statistics retrieved successfully");
      expect(res.data).toEqual({
        totalOrders: 20,
        newOrders: 3,
        batchedOrders: 4,
        completedOrders: 10,
        cancelledOrders: 2,
        pendingPayments: 5,
        recentOrders: 7,
        todayRevenue: 150,
      });
    });
  });
});
