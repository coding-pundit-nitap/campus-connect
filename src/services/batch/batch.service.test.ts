import { randomInt } from "node:crypto";

import {
  asPrisma,
  callArg,
  createPrismaMock,
  mockOf,
  type PrismaMock,
} from "@tests/helpers";
import { buildBatchRow } from "@tests/helpers/services";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mocked,
  vi,
} from "vitest";

import { publishBatchProgress } from "@/lib/batch-progress-publisher";
import { BadRequestError, NotFoundError } from "@/lib/custom-error";
import { BatchRepository } from "@/repositories/batch.repository";
import { OrderRepository } from "@/repositories/order.repository";
import { ProductRepository } from "@/repositories/product.repository";
import { ShopRepository } from "@/repositories/shop.repository";
import { NotificationService } from "@/services/notification/notification.service";

import { BatchService } from "./batch.service";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/batch-progress-publisher", () => ({
  publishBatchProgress: vi.fn(),
}));
vi.mock("node:crypto", async (importOriginal) => ({
  ...(await importOriginal<typeof import("node:crypto")>()),
  randomInt: vi.fn(() => 4321),
}));

// 2030-01-01 05:30 in Asia/Kolkata (UTC+05:30).
const NOW = new Date("2030-01-01T00:00:00Z");
/** UTC instant of `hh:mm` IST on 2030-01-(day). */
const ist = (hh: number, mm = 0, day = 1) =>
  new Date(Date.UTC(2030, 0, day, hh, mm) - 330 * 60_000);
const slot = (minutes: number, id = `slot-${minutes}`) => ({
  id,
  cutoff_time_minutes: minutes,
  sort_order: 0,
});

describe("BatchService", () => {
  let batchRepository: Mocked<BatchRepository>;
  let orderRepository: Mocked<OrderRepository>;
  let productRepository: Mocked<ProductRepository>;
  let shopRepository: Mocked<ShopRepository>;
  let notificationService: Mocked<NotificationService>;
  let prisma: PrismaMock;
  let service: BatchService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"], now: NOW });
    batchRepository = mockOf<BatchRepository>();
    orderRepository = mockOf<OrderRepository>();
    productRepository = mockOf<ProductRepository>();
    shopRepository = mockOf<ShopRepository>();
    notificationService = mockOf<NotificationService>();
    prisma = createPrismaMock();
    service = new BatchService(
      batchRepository,
      orderRepository,
      productRepository,
      shopRepository,
      notificationService,
      asPrisma(prisma)
    );

    batchRepository.findMany.mockResolvedValue([] as never);
    batchRepository.updateStatus.mockImplementation(
      async (id, status) => buildBatchRow({ id, status }) as never
    );
    orderRepository.findMany.mockResolvedValue([] as never);
    prisma.batch.findMany.mockResolvedValue([]);
  });

  afterEach(() => vi.useRealTimers());

  const ordersOf = (...ids: string[]) =>
    orderRepository.findMany.mockResolvedValue(
      ids.map((id) => ({ id })) as never
    );

  describe("getBatchSlotsWithAvailability", () => {
    it("auto-locks expired batches, then flags slots whose batch left OPEN", async () => {
      batchRepository.findActiveSlots.mockResolvedValue([
        slot(600),
        slot(840),
        slot(1200),
      ] as never);
      batchRepository.findBatchesByTimeRange.mockResolvedValue([
        { cutoff_time: ist(10), status: "LOCKED" },
        { cutoff_time: ist(14), status: "OPEN" },
      ] as never);

      const result = await service.getBatchSlotsWithAvailability("shop-1");

      expect(prisma.batch.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: "OPEN",
            cutoff_time: { lt: NOW },
            shop_id: "shop-1",
          },
        })
      );
      expect(batchRepository.findBatchesByTimeRange).toHaveBeenCalledWith(
        "shop-1",
        ist(0),
        new Date(ist(23, 59).getTime() + 59_000)
      );
      expect(result.map((s) => s.is_today_available)).toEqual([
        false,
        true,
        true,
      ]);
    });
  });

  describe("lockBatch / forceLockBatch", () => {
    it.each([
      ["lockBatch", "OPEN"],
      ["forceLockBatch", "PENDING_REVIEW"],
    ] as const)(
      "%s locks, publishes progress, batches orders and issues OTPs",
      async (method, status) => {
        batchRepository.findById.mockResolvedValue({
          id: "batch-1",
          shop_id: "shop-1",
          status,
        } as never);
        ordersOf("o1", "o2");

        await service[method]("batch-1", "shop-1");

        expect(batchRepository.updateStatus).toHaveBeenCalledWith(
          "batch-1",
          "LOCKED"
        );
        expect(publishBatchProgress).toHaveBeenCalledWith({
          batchId: "batch-1",
          shopId: "shop-1",
          status: "LOCKED",
          collectiveTotal: 150,
          minRequired: 100,
        });
        expect(prisma.batchDeliveryStatus.upsert).toHaveBeenCalledWith({
          where: { batch_id: "batch-1" },
          update: { current_milestone: "PACKING" },
          create: { batch_id: "batch-1", current_milestone: "PACKING" },
        });
        expect(orderRepository.batchUpdateStatus).toHaveBeenCalledWith(
          ["o1", "o2"],
          "BATCHED"
        );
        expect(orderRepository.update).toHaveBeenCalledWith("o1", {
          delivery_otp: "4321",
        });
        expect(orderRepository.update).toHaveBeenCalledWith("o2", {
          delivery_otp: "4321",
        });
      }
    );

    it("publishes a null minimum and skips order updates for an empty batch", async () => {
      batchRepository.findById.mockResolvedValue({
        id: "batch-1",
        shop_id: "shop-1",
        status: "OPEN",
      } as never);
      batchRepository.updateStatus.mockResolvedValue(
        buildBatchRow({ min_order_value_snapshot: null }) as never
      );

      await service.lockBatch("batch-1", "shop-1");

      expect(publishBatchProgress).toHaveBeenCalledWith(
        expect.objectContaining({ minRequired: null })
      );
      expect(orderRepository.batchUpdateStatus).not.toHaveBeenCalled();
      expect(orderRepository.update).not.toHaveBeenCalled();
    });

    it.each([
      ["lockBatch", null, NotFoundError, "Batch not found"],
      [
        "lockBatch",
        { shop_id: "other", status: "OPEN" },
        Error,
        "Unauthorized: Batch does not belong to your shop",
      ],
      [
        "lockBatch",
        { shop_id: "shop-1", status: "LOCKED" },
        Error,
        "Only OPEN batches can be locked",
      ],
      ["forceLockBatch", null, NotFoundError, "Batch not found"],
      [
        "forceLockBatch",
        { shop_id: "other", status: "PENDING_REVIEW" },
        Error,
        "Unauthorized: Batch does not belong to your shop",
      ],
      [
        "forceLockBatch",
        { shop_id: "shop-1", status: "OPEN" },
        Error,
        "Only PENDING_REVIEW batches can be force-locked",
      ],
    ] as const)(
      "%s rejects batch %j",
      async (method, batch, ErrorType, message) => {
        batchRepository.findById.mockResolvedValue(batch as never);

        const promise = service[method]("batch-1", "shop-1");

        await expect(promise).rejects.toBeInstanceOf(ErrorType);
        await expect(promise).rejects.toThrow(message);
        expect(batchRepository.updateStatus).not.toHaveBeenCalled();
      }
    );
  });

  describe("getBatchSummary", () => {
    it("names each product line, defaulting unknown items and quantities", async () => {
      batchRepository.findById.mockResolvedValue({
        id: "b1",
        shop_id: "shop-1",
      } as never);
      batchRepository.getOrderItemSummary.mockResolvedValue([
        { product_id: "p1", _sum: { quantity: 3 } },
        { product_id: "p2", _sum: { quantity: null } },
      ] as never);
      productRepository.findManyByShopId.mockResolvedValue([
        { id: "p1", name: "Pen" },
      ] as never);

      const result = await service.getBatchSummary("b1");

      expect(productRepository.findManyByShopId).toHaveBeenCalledWith(
        "shop-1",
        {
          where: { id: { in: ["p1", "p2"] } },
          select: { id: true, name: true },
        }
      );
      expect(result).toEqual([
        { product_id: "p1", name: "Pen", quantity: 3 },
        { product_id: "p2", name: "Unknown Item", quantity: 0 },
      ]);
    });

    it("throws NotFoundError for an unknown batch", async () => {
      batchRepository.findById.mockResolvedValue(null as never);

      await expect(service.getBatchSummary("b1")).rejects.toBeInstanceOf(
        NotFoundError
      );
    });
  });

  describe("autoLockExpiredBatches", () => {
    it("runs the snapshot-aware cutoff scoped to the shop", async () => {
      prisma.batch.findMany.mockResolvedValueOnce([
        {
          id: "b1",
          shop_id: "shop-1",
          shop: { name: "S", user: null },
          orders: [],
        },
      ]);
      prisma.$queryRaw.mockResolvedValue([
        { id: "b1", collective_total: "10", min_order_value_snapshot: "100" },
      ]);

      await service.autoLockExpiredBatches("shop-1");

      expect(prisma.batch.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: "OPEN",
            cutoff_time: { lt: NOW },
            shop_id: "shop-1",
          },
        })
      );
      expect(prisma.batch.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ["b1"] } },
        data: { status: "PENDING_REVIEW" },
      });
      expect(batchRepository.updateStatus).not.toHaveBeenCalled();
    });

    it("swallows cutoff failures so the read path keeps working", async () => {
      prisma.batch.findMany.mockRejectedValueOnce(new Error("db down"));

      await expect(
        service.autoLockExpiredBatches("shop-1")
      ).resolves.toBeUndefined();
    });
  });

  describe("getNextSlot", () => {
    beforeEach(() => {
      shopRepository.findById.mockResolvedValue({
        id: "shop-1",
        is_active: true,
        accepting_orders: true,
      } as never);
      batchRepository.findFirst.mockResolvedValue(null as never);
      batchRepository.findOpenBatchByCutoff.mockResolvedValue(null as never);
    });

    it("throws when the shop does not exist", async () => {
      shopRepository.findById.mockResolvedValue(null as never);

      await expect(service.getNextSlot("shop-1")).rejects.toBeInstanceOf(
        NotFoundError
      );
    });

    it("is disabled when no slots are configured", async () => {
      shopRepository.findById.mockResolvedValue({
        is_active: true,
        accepting_orders: false,
      } as never);
      batchRepository.findActiveSlots.mockResolvedValue([] as never);

      await expect(service.getNextSlot("shop-1")).resolves.toEqual({
        enabled: false,
        cutoff_time: null,
        batch_id: null,
        is_open: false,
      });
    });

    it("picks the earliest future slot today and reports its open batch", async () => {
      batchRepository.findActiveSlots.mockResolvedValue([
        slot(840),
        slot(300),
        slot(600),
      ] as never);
      batchRepository.findOpenBatchByCutoff.mockResolvedValue({
        id: "b-open",
      } as never);

      const result = await service.getNextSlot("shop-1");

      expect(batchRepository.findActiveSlots).toHaveBeenCalledWith("shop-1", {
        select: { id: true, cutoff_time_minutes: true, sort_order: true },
      });
      expect(result).toEqual({
        enabled: true,
        cutoff_time: ist(10),
        batch_id: "b-open",
        is_open: true,
      });
    });

    it("skips slots whose batch is already locked but accepts an OPEN one", async () => {
      batchRepository.findActiveSlots.mockResolvedValue([
        slot(600),
        slot(840),
      ] as never);
      batchRepository.findFirst
        .mockResolvedValueOnce({ id: "b1", status: "LOCKED" } as never)
        .mockResolvedValueOnce({ id: "b2", status: "OPEN" } as never);

      const result = await service.getNextSlot("shop-1");

      expect(result).toMatchObject({ cutoff_time: ist(14), batch_id: null });
    });

    it("rolls to later days and finally falls back to tomorrow's first slot", async () => {
      batchRepository.findActiveSlots.mockResolvedValue([
        slot(840),
        slot(600),
      ] as never);
      batchRepository.findFirst.mockResolvedValue({
        id: "b",
        status: "LOCKED",
      } as never);

      const result = await service.getNextSlot("shop-1");

      expect(batchRepository.findFirst).toHaveBeenCalledTimes(6);
      expect(
        callArg<{ where: { cutoff_time: Date } }>(batchRepository.findFirst, 5)
          .where.cutoff_time
      ).toEqual(ist(14, 0, 3));
      expect(result).toMatchObject({ cutoff_time: ist(10, 0, 2) });
    });
  });

  describe("ensureNextOpenBatch", () => {
    beforeEach(() => {
      batchRepository.findFirst.mockResolvedValue(null as never);
    });

    it("does nothing without slots", async () => {
      batchRepository.findActiveSlots.mockResolvedValue([] as never);

      await service.ensureNextOpenBatch("shop-1");

      expect(batchRepository.create).not.toHaveBeenCalled();
    });

    it("does nothing when an open batch already exists", async () => {
      batchRepository.findActiveSlots.mockResolvedValue([slot(600)] as never);
      batchRepository.findOpenBatchByCutoff.mockResolvedValue({
        id: "b",
      } as never);

      await service.ensureNextOpenBatch("shop-1");

      expect(batchRepository.create).not.toHaveBeenCalled();
    });

    it("creates the next open batch with the shop's minimum", async () => {
      batchRepository.findActiveSlots.mockResolvedValue([
        slot(600, "s10"),
      ] as never);
      batchRepository.findOpenBatchByCutoff.mockResolvedValue(null as never);
      shopRepository.findById.mockResolvedValue({
        batch_min_order_value: 250,
      } as never);

      await service.ensureNextOpenBatch("shop-1");

      expect(batchRepository.create).toHaveBeenCalledWith({
        data: {
          shop_id: "shop-1",
          cutoff_time: ist(10),
          status: "OPEN",
          slot_id: "s10",
          collective_total: 0,
          min_order_value_snapshot: 250,
        },
      });
    });

    it("creates the batch with a null minimum when the shop has none", async () => {
      batchRepository.findActiveSlots.mockResolvedValue([slot(600)] as never);
      batchRepository.findOpenBatchByCutoff.mockResolvedValue(null as never);
      shopRepository.findById.mockResolvedValue(null as never);

      await service.ensureNextOpenBatch("shop-1");

      expect(
        callArg<{ data: object }>(batchRepository.create).data
      ).toMatchObject({
        min_order_value_snapshot: null,
      });
    });
  });

  describe("getVendorDashboard", () => {
    const order = (id: string, extra: Record<string, unknown> = {}) => ({
      id,
      display_id: `D-${id}`,
      order_status: "NEW",
      item_total: "100",
      delivery_fee: "10.005",
      platform_fee: "2",
      user: { phone: "999" },
      delivery_address: null,
      created_at: NOW,
      ...extra,
    });

    beforeEach(() => {
      batchRepository.findActiveSlots.mockResolvedValue([] as never);
      batchRepository.findOpenBatches.mockResolvedValue([] as never);
      batchRepository.findActiveBatches.mockResolvedValue([] as never);
    });

    it("returns empty sections when there is nothing to show", async () => {
      await expect(service.getVendorDashboard("shop-1")).resolves.toEqual({
        open_batch: null,
        active_batches: [],
        direct_orders: [],
      });
    });

    it("formats open, extra open and active batches plus direct orders", async () => {
      batchRepository.findOpenBatches.mockResolvedValue([
        {
          id: "open-1",
          status: "OPEN",
          cutoff_time: NOW,
          orders: [order("o1"), order("o2", { user: null })],
        },
        { id: "open-2", status: "OPEN", cutoff_time: NOW, orders: [] },
      ] as never);
      batchRepository.findActiveBatches.mockResolvedValue([
        {
          id: "locked-1",
          status: "LOCKED",
          cutoff_time: NOW,
          orders: [order("o3")],
        },
        { id: "transit-1", status: "IN_TRANSIT", cutoff_time: NOW, orders: [] },
      ] as never);
      batchRepository.findById.mockResolvedValue({
        id: "x",
        shop_id: "shop-1",
      } as never);
      batchRepository.getOrderItemSummary.mockResolvedValue([] as never);
      productRepository.findManyByShopId.mockResolvedValue([] as never);
      orderRepository.findMany.mockResolvedValue([
        order("d1"),
        order("d2", { user: undefined }),
      ] as never);

      const result = await service.getVendorDashboard("shop-1");

      expect(result.open_batch).toEqual({
        id: "open-1",
        status: "OPEN",
        cutoff_time: NOW,
        order_count: 2,
        total_earnings: 216.01,
        orders: [
          {
            id: "o1",
            display_id: "D-o1",
            status: "NEW",
            phone: "999",
            delivery_address: null,
          },
          {
            id: "o2",
            display_id: "D-o2",
            status: "NEW",
            phone: null,
            delivery_address: null,
          },
        ],
      });
      expect(result.active_batches.map((b) => [b.id, b.item_summary])).toEqual([
        ["open-2", undefined],
        ["locked-1", []],
        ["transit-1", []],
      ]);
      expect(result.direct_orders).toEqual([
        {
          id: "d1",
          display_id: "D-d1",
          status: "NEW",
          phone: "999",
          item_total: 100,
          delivery_fee: 10.005,
          platform_fee: 2,
          total_earnings: 108.01,
          created_at: NOW,
          delivery_address: null,
        },
        expect.objectContaining({ id: "d2", phone: null }),
      ]);
      expect(callArg(orderRepository.findMany)).toMatchObject({
        where: {
          shop_id: "shop-1",
          order_status: { notIn: ["COMPLETED", "CANCELLED"] },
          OR: [{ is_direct_delivery: true }, { batch_id: null }],
        },
      });
    });
  });

  describe("unlockBatch", () => {
    it("re-opens a locked batch and resets its orders", async () => {
      batchRepository.findById.mockResolvedValue({ status: "LOCKED" } as never);
      ordersOf("o1");

      await service.unlockBatch("b1");

      expect(batchRepository.updateStatus).toHaveBeenCalledWith("b1", "OPEN");
      expect(orderRepository.batchUpdateOrders).toHaveBeenCalledWith(["o1"], {
        order_status: "NEW",
        delivery_otp: null,
      });
    });

    it("skips order updates when the batch is empty", async () => {
      batchRepository.findById.mockResolvedValue({ status: "LOCKED" } as never);

      await service.unlockBatch("b1");

      expect(orderRepository.batchUpdateOrders).not.toHaveBeenCalled();
    });

    it.each([
      [null, "Batch not found"],
      [{ status: "OPEN" }, "Only LOCKED batches can be unlocked"],
    ])("rejects batch %j", async (batch, message) => {
      batchRepository.findById.mockResolvedValue(batch as never);

      await expect(service.unlockBatch("b1")).rejects.toThrow(message);
    });
  });

  describe("startDelivery", () => {
    it("marks the batch in transit and notifies each customer with their OTP", async () => {
      batchRepository.findById.mockResolvedValue({
        status: "LOCKED",
        orders: [
          { id: "o1", user_id: "u1", display_id: "D1", delivery_otp: "1111" },
          { id: "o2", user_id: null, display_id: "D2", delivery_otp: null },
          { id: "o3", user_id: "u3", display_id: "D3", delivery_otp: null },
        ],
      } as never);
      notificationService.publishNotification
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("queue"));

      await service.startDelivery("b1");

      expect(batchRepository.updateStatus).toHaveBeenCalledWith(
        "b1",
        "IN_TRANSIT"
      );
      expect(prisma.batchDeliveryStatus.upsert).toHaveBeenCalledWith({
        where: { batch_id: "b1" },
        update: { current_milestone: "CLIMB_STARTED" },
        create: { batch_id: "b1", current_milestone: "CLIMB_STARTED" },
      });
      expect(orderRepository.batchUpdateStatus).toHaveBeenCalledWith(
        ["o1", "o2", "o3"],
        "OUT_FOR_DELIVERY"
      );
      expect(notificationService.publishNotification).toHaveBeenCalledTimes(2);
      expect(notificationService.publishNotification).toHaveBeenCalledWith(
        "u1",
        {
          title: "🚀 Order Out for Delivery!",
          message:
            "Your order D1 is out for delivery in the batch run. Share OTP 1111 to complete delivery.",
          type: "SUCCESS",
          category: "ORDER",
          action_url: "/orders/o1",
        }
      );
      expect(
        callArg<{ message: string }>(
          notificationService.publishNotification,
          1,
          1
        ).message
      ).toContain("Share OTP  to");
    });

    it("skips order updates for an empty batch", async () => {
      batchRepository.findById.mockResolvedValue({
        status: "LOCKED",
        orders: [],
      } as never);

      await service.startDelivery("b1");

      expect(orderRepository.batchUpdateStatus).not.toHaveBeenCalled();
    });

    it.each([
      [null, "Batch not found"],
      [
        { status: "OPEN", orders: [] },
        "Only LOCKED batches can start delivery",
      ],
    ])("rejects batch %j", async (batch, message) => {
      batchRepository.findById.mockResolvedValue(batch as never);

      await expect(service.startDelivery("b1")).rejects.toThrow(message);
    });
  });

  describe("completeBatch", () => {
    it("completes an in-transit batch with no pending orders", async () => {
      batchRepository.findById.mockResolvedValue({
        status: "IN_TRANSIT",
      } as never);
      batchRepository.countPendingOrders.mockResolvedValue(0);

      await service.completeBatch("b1");

      expect(batchRepository.updateStatus).toHaveBeenCalledWith(
        "b1",
        "COMPLETED"
      );
      expect(prisma.batchDeliveryStatus.upsert).toHaveBeenCalledWith({
        where: { batch_id: "b1" },
        update: { current_milestone: "ARRIVED" },
        create: { batch_id: "b1", current_milestone: "ARRIVED" },
      });
    });

    it.each([
      [null, 0, "Batch not found"],
      [{ status: "LOCKED" }, 0, "Only IN_TRANSIT batches can be completed"],
      [{ status: "IN_TRANSIT" }, 2, "2 orders still pending OTP verification"],
    ])("rejects batch %j with %i pending", async (batch, pending, message) => {
      batchRepository.findById.mockResolvedValue(batch as never);
      batchRepository.countPendingOrders.mockResolvedValue(pending);

      await expect(service.completeBatch("b1")).rejects.toThrow(message);
      expect(batchRepository.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe("generateOtpForBatch", () => {
    it("falls back to Math.random when crypto is unavailable", async () => {
      vi.mocked(randomInt).mockImplementationOnce(() => {
        throw new Error("no entropy");
      });
      vi.spyOn(Math, "random").mockReturnValueOnce(0.5);
      ordersOf("o1");

      await service.generateOtpForBatch("b1");

      expect(orderRepository.update).toHaveBeenCalledWith("o1", {
        delivery_otp: "5500",
      });
    });
  });

  describe("verifyOrderOtp", () => {
    const outForDelivery = (extra: Record<string, unknown> = {}) => ({
      id: "o1",
      delivery_otp: "1234",
      order_status: "OUT_FOR_DELIVERY",
      shop_id: "shop-1",
      payment_method: "CASH",
      user_id: "u1",
      display_id: "D1",
      ...extra,
    });

    it("completes the order, settles cash payment and notifies the customer", async () => {
      orderRepository.getOrderById.mockResolvedValue(outForDelivery() as never);

      const result = await service.verifyOrderOtp("o1", "1234", "shop-1");

      expect(result).toEqual({
        success: true,
        message: "Order delivered successfully",
      });
      expect(orderRepository.update).toHaveBeenCalledWith("o1", {
        order_status: "COMPLETED",
        actual_delivery_time: NOW,
        delivery_otp: null,
        payment_status: "COMPLETED",
      });
      expect(notificationService.publishNotification).toHaveBeenCalledWith(
        "u1",
        expect.objectContaining({
          title: "🎉 Order Delivered!",
          action_url: "/orders/o1",
        })
      );
    });

    it("leaves online payment status untouched and tolerates notify failures", async () => {
      orderRepository.getOrderById.mockResolvedValue(
        outForDelivery({ payment_method: "ONLINE" }) as never
      );
      notificationService.publishNotification.mockRejectedValue(new Error("q"));

      const result = await service.verifyOrderOtp("o1", "1234", "shop-1");

      expect(result.success).toBe(true);
      expect(
        callArg<{ payment_status: unknown }>(orderRepository.update, 0, 1)
          .payment_status
      ).toBeUndefined();
    });

    it("does not notify guest orders", async () => {
      orderRepository.getOrderById.mockResolvedValue(
        outForDelivery({ user_id: null }) as never
      );

      await service.verifyOrderOtp("o1", "1234", "shop-1");

      expect(notificationService.publishNotification).not.toHaveBeenCalled();
    });

    it("returns failure for a wrong OTP without updating", async () => {
      orderRepository.getOrderById.mockResolvedValue(outForDelivery() as never);

      await expect(
        service.verifyOrderOtp("o1", "0000", "shop-1")
      ).resolves.toEqual({
        success: false,
        message: "Invalid OTP",
      });
      expect(orderRepository.update).not.toHaveBeenCalled();
    });

    it.each([
      [null, NotFoundError, "Order not found"],
      [
        outForDelivery({ shop_id: "other" }),
        Error,
        "Unauthorized: Order does not belong to your shop",
      ],
      [
        outForDelivery({ order_status: "BATCHED" }),
        Error,
        "Order is not out for delivery",
      ],
    ])("rejects order %j", async (order, ErrorType, message) => {
      orderRepository.getOrderById.mockResolvedValue(order as never);

      const promise = service.verifyOrderOtp("o1", "1234", "shop-1");

      await expect(promise).rejects.toBeInstanceOf(ErrorType);
      await expect(promise).rejects.toThrow(message);
    });
  });

  describe("cancelBatch", () => {
    const order = (
      id: string,
      payment_method: "ONLINE" | "CASH",
      user_id: string | null,
      order_status = "BATCHED",
      item_total = "100"
    ) => ({
      id,
      user_id,
      display_id: `D-${id}`,
      payment_method,
      order_status,
      item_total,
    });

    beforeEach(() => {
      prisma.batch.update.mockResolvedValue(
        buildBatchRow({ id: "b1", status: "CANCELLED" })
      );
      batchRepository.adjustCollectiveTotal.mockResolvedValue(
        buildBatchRow({
          id: "b1",
          status: "CANCELLED",
          collective_total: 0,
        }) as never
      );
    });

    it.each(["LOCKED", "IN_TRANSIT", "PENDING_REVIEW"])(
      "cancels a %s batch, refunds online orders, removes them from the total and notifies customers",
      async (status) => {
        batchRepository.findById.mockResolvedValue({
          status,
          orders: [
            order("o1", "ONLINE", "u1", "BATCHED", "120.50"),
            order("o2", "CASH", null),
            order("o3", "CASH", "u3"),
            order("o4", "CASH", "u4", "CANCELLED", "999"),
          ],
        } as never);
        notificationService.publishNotification
          .mockResolvedValueOnce(undefined)
          .mockRejectedValueOnce(new Error("q"));

        const result = await service.cancelBatch("b1", "rain");

        expect(result).toEqual({ cancelled_orders: 3 });
        expect(prisma.$transaction).toHaveBeenCalledTimes(1);
        expect(prisma.batch.update).toHaveBeenCalledWith({
          where: { id: "b1" },
          data: { status: "CANCELLED" },
        });
        expect(batchRepository.adjustCollectiveTotal).toHaveBeenCalledWith(
          "b1",
          -320.5,
          expect.anything()
        );
        expect(publishBatchProgress).toHaveBeenCalledWith(
          expect.objectContaining({ status: "CANCELLED", collectiveTotal: 0 })
        );
        expect(orderRepository.update).toHaveBeenCalledTimes(3);
        expect(orderRepository.update).toHaveBeenCalledWith(
          "o1",
          {
            order_status: "CANCELLED",
            payment_status: "REFUNDED",
            delivery_otp: null,
          },
          undefined,
          expect.anything()
        );
        expect(orderRepository.update).toHaveBeenCalledWith(
          "o2",
          {
            order_status: "CANCELLED",
            payment_status: "CANCELLED",
            delivery_otp: null,
          },
          undefined,
          expect.anything()
        );
        expect(orderRepository.update).not.toHaveBeenCalledWith(
          "o4",
          expect.anything(),
          undefined,
          expect.anything()
        );
        expect(notificationService.publishNotification).toHaveBeenCalledTimes(
          2
        );
        expect(notificationService.publishNotification).toHaveBeenCalledWith(
          "u1",
          expect.objectContaining({
            title: "❌ Order Batch Cancelled",
            action_url: "/orders/o1",
          })
        );
      }
    );

    it("leaves the total alone when nothing counted is left to cancel", async () => {
      batchRepository.findById.mockResolvedValue({
        status: "LOCKED",
        orders: [order("o1", "CASH", "u1", "CANCELLED")],
      } as never);

      await expect(service.cancelBatch("b1", "")).resolves.toEqual({
        cancelled_orders: 0,
      });
      expect(batchRepository.adjustCollectiveTotal).not.toHaveBeenCalled();
      expect(publishBatchProgress).toHaveBeenCalledWith(
        expect.objectContaining({ batchId: "b1", status: "CANCELLED" })
      );
      expect(notificationService.publishNotification).not.toHaveBeenCalled();
    });

    it("loads each order's status and item_total so counted orders can be decremented", async () => {
      batchRepository.findById.mockResolvedValue({
        status: "LOCKED",
        orders: [],
      } as never);

      await service.cancelBatch("b1", "");

      expect(batchRepository.findById).toHaveBeenCalledWith("b1", {
        include: {
          orders: {
            select: {
              id: true,
              user_id: true,
              payment_status: true,
              display_id: true,
              payment_method: true,
              order_status: true,
              item_total: true,
            },
          },
          shop: { select: { name: true } },
        },
      });
    });

    it.each([
      [null, "Batch not found"],
      [
        { status: "OPEN", orders: [] },
        "Can only cancel LOCKED, IN_TRANSIT, or PENDING_REVIEW batches",
      ],
      [
        { status: "COMPLETED", orders: [] },
        "Can only cancel LOCKED, IN_TRANSIT, or PENDING_REVIEW batches",
      ],
      [
        { status: "CANCELLED", orders: [] },
        "Can only cancel LOCKED, IN_TRANSIT, or PENDING_REVIEW batches",
      ],
    ])("rejects batch %j", async (batch, message) => {
      batchRepository.findById.mockResolvedValue(batch as never);

      await expect(service.cancelBatch("b1", "")).rejects.toThrow(message);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe("cancelled orders are never revived by lifecycle transitions", () => {
    const notCancelled = {
      where: { batch_id: "b1", order_status: { not: "CANCELLED" } },
      select: { id: true },
    };

    it("lock/force-lock only batch and OTP the batch's non-cancelled orders", async () => {
      batchRepository.findById.mockResolvedValue({
        id: "b1",
        shop_id: "shop-1",
        status: "PENDING_REVIEW",
      } as never);

      await service.forceLockBatch("b1", "shop-1");

      expect(orderRepository.findMany).toHaveBeenCalledTimes(2);
      expect(orderRepository.findMany).toHaveBeenNthCalledWith(1, notCancelled);
      expect(orderRepository.findMany).toHaveBeenNthCalledWith(2, notCancelled);
    });

    it("unlock only resets non-cancelled orders", async () => {
      batchRepository.findById.mockResolvedValue({
        id: "b1",
        status: "LOCKED",
      } as never);

      await service.unlockBatch("b1");

      expect(orderRepository.findMany).toHaveBeenCalledWith(notCancelled);
    });

    it("start delivery only dispatches non-cancelled orders", async () => {
      batchRepository.findById.mockResolvedValue({
        id: "b1",
        status: "LOCKED",
        orders: [],
      } as never);

      await service.startDelivery("b1");

      expect(batchRepository.findById).toHaveBeenCalledWith("b1", {
        include: {
          orders: {
            where: { order_status: { not: "CANCELLED" } },
            select: {
              id: true,
              user_id: true,
              display_id: true,
              delivery_otp: true,
            },
          },
        },
      });
    });

    it("force-lock of a non-PENDING_REVIEW batch is a BadRequestError", async () => {
      batchRepository.findById.mockResolvedValue({
        id: "b1",
        shop_id: "shop-1",
        status: "OPEN",
      } as never);

      await expect(
        service.forceLockBatch("b1", "shop-1")
      ).rejects.toBeInstanceOf(BadRequestError);
      expect(batchRepository.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe("query and message contracts", () => {
    it("lockBatch and forceLockBatch load only what the guards need", async () => {
      batchRepository.findById.mockResolvedValue({
        id: "b1",
        shop_id: "shop-1",
        status: "OPEN",
      } as never);
      await service.lockBatch("b1", "shop-1");
      expect(batchRepository.findById).toHaveBeenLastCalledWith("b1", {
        select: { id: true, shop_id: true, status: true, cutoff_time: true },
      });

      batchRepository.findById.mockResolvedValue({
        id: "b1",
        shop_id: "shop-1",
        status: "PENDING_REVIEW",
      } as never);
      await service.forceLockBatch("b1", "shop-1");
      expect(batchRepository.findById).toHaveBeenLastCalledWith("b1", {
        select: { id: true, shop_id: true, status: true },
      });
    });

    it("lockBatch rejects another shop's batch and a non-OPEN batch", async () => {
      batchRepository.findById.mockResolvedValue({
        id: "b1",
        shop_id: "other",
        status: "OPEN",
      } as never);
      await expect(service.lockBatch("b1", "shop-1")).rejects.toThrow(
        "Unauthorized: Batch does not belong to your shop"
      );
      batchRepository.findById.mockResolvedValue({
        id: "b1",
        shop_id: "shop-1",
        status: "PENDING_REVIEW",
      } as never);
      await expect(service.lockBatch("b1", "shop-1")).rejects.toThrow(
        "Only OPEN batches can be locked"
      );
      expect(batchRepository.updateStatus).not.toHaveBeenCalled();
    });

    it("not-found errors carry their user-facing message", async () => {
      batchRepository.findById.mockResolvedValue(null as never);
      await expect(service.getBatchSummary("b1")).rejects.toThrow(
        "Batch not found"
      );
      shopRepository.findById.mockResolvedValue(null as never);
      await expect(service.getNextSlot("shop-1")).rejects.toThrow(
        "Shop not found"
      );
    });

    it("getNextSlot skips a slot whose cutoff is exactly now and queries batches by id/status", async () => {
      shopRepository.findById.mockResolvedValue({
        id: "shop-1",
        is_active: true,
        accepting_orders: true,
      } as never);
      // NOW is 05:30 IST.
      batchRepository.findActiveSlots.mockResolvedValue([
        slot(330),
        slot(600),
      ] as never);
      batchRepository.findFirst.mockResolvedValue(null as never);
      batchRepository.findOpenBatchByCutoff.mockResolvedValue(null as never);

      const result = await service.getNextSlot("shop-1");

      expect(result).toMatchObject({ cutoff_time: ist(10) });
      expect(shopRepository.findById).toHaveBeenCalledWith("shop-1", {
        select: { id: true, is_active: true, accepting_orders: true },
      });
      expect(batchRepository.findFirst).toHaveBeenCalledTimes(1);
      expect(batchRepository.findFirst).toHaveBeenCalledWith({
        where: { shop_id: "shop-1", cutoff_time: ist(10) },
        select: { id: true, status: true },
      });
      expect(batchRepository.findOpenBatchByCutoff).toHaveBeenCalledWith(
        "shop-1",
        ist(10),
        { select: { id: true } }
      );
    });

    it("ensureNextOpenBatch links the slot matching the chosen cutoff", async () => {
      batchRepository.findActiveSlots.mockResolvedValue([
        slot(600, "s1000"),
        slot(855, "s1415"),
      ] as never);
      batchRepository.findFirst
        .mockResolvedValueOnce({ id: "b", status: "LOCKED" } as never)
        .mockResolvedValue(null as never);
      batchRepository.findOpenBatchByCutoff.mockResolvedValue(null as never);
      shopRepository.findById.mockResolvedValue({
        batch_min_order_value: null,
      } as never);

      await service.ensureNextOpenBatch("shop-1");

      expect(batchRepository.findOpenBatchByCutoff).toHaveBeenCalledWith(
        "shop-1",
        ist(14, 15),
        { select: { id: true } }
      );
      expect(shopRepository.findById).toHaveBeenCalledWith("shop-1", {
        select: { batch_min_order_value: true },
      });
      expect(
        callArg<{ data: { slot_id: string } }>(batchRepository.create).data
          .slot_id
      ).toBe("s1415");
    });

    it("ensureNextOpenBatch leaves slot_id unset when no slot matches", async () => {
      batchRepository.findActiveSlots.mockResolvedValue([slot(600)] as never);
      batchRepository.findFirst.mockResolvedValue({
        id: "b",
        status: "LOCKED",
      } as never);
      batchRepository.findOpenBatchByCutoff.mockResolvedValue(null as never);
      shopRepository.findById.mockResolvedValue(null as never);

      await service.ensureNextOpenBatch("shop-1");

      // Every candidate day is locked, so the fallback is tomorrow 10:00,
      // which matches the slot.
      expect(
        callArg<{ data: { slot_id?: string } }>(batchRepository.create).data
          .slot_id
      ).toBe("slot-600");
    });

    it("getVendorDashboard loads the order fields the dashboard shows", async () => {
      batchRepository.findActiveSlots.mockResolvedValue([] as never);
      batchRepository.findOpenBatches.mockResolvedValue([] as never);
      batchRepository.findActiveBatches.mockResolvedValue([] as never);

      await service.getVendorDashboard("shop-1");

      const orderSelect = {
        id: true,
        display_id: true,
        order_status: true,
        item_total: true,
        delivery_fee: true,
        platform_fee: true,
        user: { select: { phone: true } },
        delivery_address: {
          select: {
            hostel_block: true,
            label: true,
            building: true,
            room_number: true,
          },
        },
      };
      expect(batchRepository.findOpenBatches).toHaveBeenCalledWith("shop-1", {
        include: { orders: { select: orderSelect } },
      });
      expect(batchRepository.findActiveBatches).toHaveBeenCalledWith("shop-1", {
        include: { orders: { select: orderSelect } },
      });
      expect(orderRepository.findMany).toHaveBeenCalledWith({
        where: {
          shop_id: "shop-1",
          order_status: { notIn: ["COMPLETED", "CANCELLED"] },
          OR: [{ is_direct_delivery: true }, { batch_id: null }],
        },
        select: { ...orderSelect, created_at: true },
        orderBy: { created_at: "asc" },
      });
    });

    it("verifyOrderOtp loads the guard fields and sends the delivered notice", async () => {
      orderRepository.getOrderById.mockResolvedValue({
        id: "o1",
        delivery_otp: "1234",
        order_status: "OUT_FOR_DELIVERY",
        shop_id: "shop-1",
        payment_method: "CASH",
        user_id: "u1",
        display_id: "D1",
      } as never);

      await service.verifyOrderOtp("o1", "1234", "shop-1");

      expect(orderRepository.getOrderById).toHaveBeenCalledWith("o1", {
        select: {
          id: true,
          delivery_otp: true,
          order_status: true,
          shop_id: true,
          batch_id: true,
          payment_method: true,
          user_id: true,
          display_id: true,
        },
      });
      expect(notificationService.publishNotification).toHaveBeenCalledWith(
        "u1",
        {
          title: "🎉 Order Delivered!",
          message: "Your order D1 was successfully delivered. Thank you!",
          type: "SUCCESS",
          category: "ORDER",
          action_url: "/orders/o1",
        }
      );
    });

    it("cancelBatch tells each customer the run was cancelled and a refund is coming", async () => {
      prisma.batch.update.mockResolvedValue(
        buildBatchRow({ id: "b1", status: "CANCELLED" })
      );
      batchRepository.findById.mockResolvedValue({
        status: "LOCKED",
        orders: [
          {
            id: "o1",
            user_id: "u1",
            display_id: "D1",
            payment_method: "ONLINE",
            order_status: "BATCHED",
            item_total: "0",
          },
        ],
      } as never);

      await service.cancelBatch("b1", "");

      expect(notificationService.publishNotification).toHaveBeenCalledWith(
        "u1",
        {
          title: "❌ Order Batch Cancelled",
          message:
            "Your order D1 was cancelled because the delivery run was cancelled. A refund has been initiated if you paid online.",
          type: "ERROR",
          category: "ORDER",
          action_url: "/orders/o1",
        }
      );
    });

    it("formatRupees shows whole rupees plainly and paise to two places", async () => {
      const { formatRupees } = await import("./batch.service");
      expect(formatRupees(1800)).toBe("1800");
      expect(formatRupees(180.004)).toBe("180");
      expect(formatRupees(0.4)).toBe("0.40");
      expect(formatRupees(150.39999999999998)).toBe("150.40");
    });
  });

  describe("updateBatchMilestone", () => {
    it("upserts the milestone with rider details", async () => {
      const eta = new Date("2030-01-01T09:00:00Z");

      await service.updateBatchMilestone("b1", "ARRIVED", "Ravi", "123", eta);

      expect(prisma.batchDeliveryStatus.upsert).toHaveBeenCalledWith({
        where: { batch_id: "b1" },
        update: {
          current_milestone: "ARRIVED",
          rider_name: "Ravi",
          rider_phone: "123",
          estimated_arrival: eta,
        },
        create: {
          batch_id: "b1",
          current_milestone: "ARRIVED",
          rider_name: "Ravi",
          rider_phone: "123",
          estimated_arrival: eta,
        },
      });
    });

    it("leaves rider fields untouched on update when omitted", async () => {
      await service.updateBatchMilestone("b1", "PACKING", "");

      expect(
        callArg<{ update: object }>(prisma.batchDeliveryStatus.upsert).update
      ).toEqual({
        current_milestone: "PACKING",
        rider_name: undefined,
        rider_phone: undefined,
        estimated_arrival: undefined,
      });
    });
  });

  describe("autoCloseExpiredBatches", () => {
    type Expired = {
      id: string;
      shop_id: string;
      shop: { name: string; user: { id: string } | null };
      orders: { id: string }[];
    };
    const expired = (id: string, extra: Partial<Expired> = {}): Expired => ({
      id,
      shop_id: "shop-1",
      shop: { name: "Store", user: { id: "owner-1" } },
      orders: [{ id: `${id}-o1` }],
      ...extra,
    });
    const lockRow = (id: string, total: string, min: string | null) => ({
      id,
      collective_total: total,
      min_order_value_snapshot: min,
    });
    const arrange = (opts: {
      expired?: Expired[];
      locked?: ReturnType<typeof lockRow>[];
    }) => {
      prisma.batch.findMany.mockResolvedValueOnce(opts.expired ?? []);
      prisma.$queryRaw.mockResolvedValue(opts.locked ?? []);
    };

    it("does nothing when no batches are expired", async () => {
      arrange({});

      await service.autoCloseExpiredBatches();

      expect(prisma.batch.findMany).toHaveBeenCalledWith({
        where: { status: "OPEN", cutoff_time: { lt: NOW } },
        select: {
          id: true,
          shop_id: true,
          shop: { select: { name: true, user: { select: { id: true } } } },
          orders: { where: { order_status: "NEW" }, select: { id: true } },
        },
      });
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(notificationService.publishNotification).not.toHaveBeenCalled();
    });

    it("locks batches meeting their minimum and parks short ones for review", async () => {
      arrange({
        expired: [
          expired("b-ok", { orders: [{ id: "b-ok-o1" }, { id: "b-ok-o2" }] }),
          expired("b-nomin"),
          expired("b-short"),
          expired("b-gone"),
        ],
        locked: [
          lockRow("b-ok", "500", "300"),
          lockRow("b-nomin", "50", null),
          lockRow("b-short", "120", "300"),
        ],
      });

      await service.autoCloseExpiredBatches();

      expect(callArg(prisma.$queryRaw, 0, 1)).toEqual(
        expect.objectContaining({
          values: ["b-gone", "b-nomin", "b-ok", "b-short"],
        })
      );
      expect(prisma.batch.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ["b-short"] } },
        data: { status: "PENDING_REVIEW" },
      });
      expect(prisma.batch.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ["b-ok", "b-nomin"] } },
        data: { status: "LOCKED" },
      });
      expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
      const sql = (prisma.$executeRaw.mock.calls[0][0] as string[]).join("?");
      expect(sql).toContain(`SET order_status = 'BATCHED'`);
      expect(sql).toContain(`AND order_status = 'NEW'`);
      expect(prisma.$executeRaw.mock.calls[0][1]).toEqual(["b-ok", "b-nomin"]);
      expect(publishBatchProgress).toHaveBeenCalledTimes(3);
      expect(publishBatchProgress).toHaveBeenCalledWith({
        batchId: "b-ok",
        shopId: "shop-1",
        status: "LOCKED",
        collectiveTotal: 500,
        minRequired: 300,
      });
      expect(publishBatchProgress).toHaveBeenCalledWith({
        batchId: "b-nomin",
        shopId: "shop-1",
        status: "LOCKED",
        collectiveTotal: 50,
        minRequired: null,
      });
      expect(publishBatchProgress).toHaveBeenCalledWith({
        batchId: "b-short",
        shopId: "shop-1",
        status: "PENDING_REVIEW",
        collectiveTotal: 120,
        minRequired: 300,
      });
      expect(notificationService.publishNotification).toHaveBeenCalledWith(
        "owner-1",
        {
          title: "🚀 Batch Ready!",
          message: "Batch for Store is ready with 2 orders. Start preparing!",
          type: "SUCCESS",
          category: "ORDER",
          action_url: "/owner-shops/orders/b-ok-o1",
        }
      );
      expect(notificationService.publishNotification).toHaveBeenCalledWith(
        "owner-1",
        {
          title: "⚠️ Batch Below Minimum",
          message:
            "Batch for Store is ₹180 short of its collective minimum. Decide whether to proceed or cancel.",
          type: "WARNING",
          category: "ORDER",
          action_url: "/owner-shops/orders/b-short-o1",
        }
      );
    });

    it.each([
      ["exactly at", "300", "300", "LOCKED"],
      ["one paisa below", "299.99", "300", "PENDING_REVIEW"],
      ["a zero minimum with a zero total", "0", "0", "LOCKED"],
      ["no minimum with a zero total", "0", null, "LOCKED"],
    ])("a batch %s its minimum ends up %s", async (_l, total, min, status) => {
      arrange({
        expired: [expired("b1")],
        locked: [lockRow("b1", total, min)],
      });

      await service.autoCloseExpiredBatches();

      expect(prisma.batch.updateMany).toHaveBeenCalledTimes(1);
      expect(prisma.batch.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ["b1"] } },
        data: { status },
      });
      expect(prisma.$executeRaw).toHaveBeenCalledTimes(
        status === "LOCKED" ? 1 : 0
      );
    });

    it("states a fractional shortfall in paise", async () => {
      arrange({
        expired: [expired("b1")],
        locked: [lockRow("b1", "299.6", "300")],
      });

      await service.autoCloseExpiredBatches();

      expect(notificationService.publishNotification).toHaveBeenCalledWith(
        "owner-1",
        expect.objectContaining({
          message: expect.stringContaining("₹0.40 short"),
        })
      );
    });

    it("skips owner notices for ownerless shops and for locked batches with no orders", async () => {
      arrange({
        expired: [
          expired("b-1", { shop: { name: "S", user: null } }),
          expired("b-2", { orders: [] }),
          expired("b-3", { shop: { name: "S", user: null } }),
        ],
        locked: [
          lockRow("b-1", "1", null),
          lockRow("b-2", "1", null),
          lockRow("b-3", "1", "100"),
        ],
      });

      await service.autoCloseExpiredBatches();

      expect(notificationService.publishNotification).not.toHaveBeenCalled();
      expect(publishBatchProgress).toHaveBeenCalledTimes(3);
    });

    it("still warns about a short batch with no NEW orders, linking the dashboard", async () => {
      arrange({
        expired: [expired("b-short", { orders: [] })],
        locked: [lockRow("b-short", "10", "100")],
      });

      await service.autoCloseExpiredBatches();

      expect(prisma.batch.updateMany).toHaveBeenCalledTimes(1);
      expect(prisma.$executeRaw).not.toHaveBeenCalled();
      expect(notificationService.publishNotification).toHaveBeenCalledWith(
        "owner-1",
        expect.objectContaining({
          title: "⚠️ Batch Below Minimum",
          message: expect.stringContaining("₹90 short"),
          action_url: "/owner-shops",
        })
      );
    });

    it("does nothing when another run already closed every batch", async () => {
      arrange({ expired: [expired("b1")], locked: [] });

      await service.autoCloseExpiredBatches();

      expect(prisma.batch.updateMany).not.toHaveBeenCalled();
      expect(publishBatchProgress).not.toHaveBeenCalled();
    });

    it("logs and continues when owner notifications fail", async () => {
      notificationService.publishNotification.mockRejectedValue(new Error("q"));
      arrange({
        expired: [expired("b-ok"), expired("b-short")],
        locked: [lockRow("b-ok", "500", null), lockRow("b-short", "1", "100")],
      });

      await expect(service.autoCloseExpiredBatches()).resolves.toBeUndefined();
      expect(notificationService.publishNotification).toHaveBeenCalledTimes(2);
    });
  });
});
