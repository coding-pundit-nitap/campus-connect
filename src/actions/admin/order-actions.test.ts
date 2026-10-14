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

      expect(orders.findMany).toHaveBeenCalledWith({
        where: {},
        take: 11,
        skip: 0,
        cursor: undefined,
        orderBy: { created_at: "desc" },
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

      const res = await getOrderStatsAction();

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
