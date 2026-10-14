import {
  asPrisma,
  callArg,
  createPrismaMock,
  mockOf,
  type PrismaMock,
} from "@tests/helpers";
import {
  buildAddress,
  buildCart,
  buildCartItem,
  buildProduct,
  buildShop,
} from "@tests/helpers/services";
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
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/custom-error";
import { orderWithDetailsInclude } from "@/lib/utils/order.utils";
import { OrderRepository } from "@/repositories/order.repository";
import { PlatformSettingsRepository } from "@/repositories/platform-settings.repository";
import { NotificationService } from "@/services/notification/notification.service";

import { OrderService } from "./order.service";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/batch-progress-publisher", () => ({
  publishBatchProgress: vi.fn(),
}));

type BatchRow = { id: string; status: string; cutoff_time: string | Date };
type CreatedOrder = { id: string; display_id: string } & Record<
  string,
  unknown
>;

// 2030-01-01 05:30 IST; the "14:00 IST" slot below is 08:30 UTC the same day.
const NOW = new Date("2030-01-01T00:00:00Z");
const SLOT_TIME = new Date("2030-01-01T08:30:00Z");
const SLOT_MINUTES = 14 * 60;
const FUTURE_CUTOFF = new Date("2030-01-01T10:00:00Z");

const sqlOf = (strings: TemplateStringsArray) => strings.join("?");

describe("OrderService", () => {
  let prisma: PrismaMock;
  let orderRepository: Mocked<OrderRepository>;
  let platformSettingsRepository: Mocked<PlatformSettingsRepository>;
  let notificationService: Mocked<NotificationService>;
  let service: OrderService;
  /** Rows returned, in order, by each `SELECT ... FROM "Batch" ... FOR UPDATE`. */
  let batchLocks: BatchRow[][];
  /** Behaviour of each successive `nextval(...)` call. */
  let nextval: Array<() => unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"], now: NOW });

    prisma = createPrismaMock();
    orderRepository = mockOf<OrderRepository>();
    platformSettingsRepository = mockOf<PlatformSettingsRepository>();
    notificationService = mockOf<NotificationService>();
    service = new OrderService(
      orderRepository,
      platformSettingsRepository,
      notificationService,
      asPrisma(prisma)
    );

    batchLocks = [];
    nextval = [() => [{ next_id: 1234n }]];

    prisma.cart.findUnique.mockResolvedValue(buildCart());
    prisma.shop.findFirst.mockResolvedValue(buildShop());
    prisma.userAddress.findUnique.mockResolvedValue(buildAddress());
    prisma.shopDeliveryBuilding.count.mockResolvedValue(0);
    prisma.product.findUnique.mockResolvedValue(buildProduct());
    prisma.product.updateMany.mockResolvedValue({ count: 1 });
    prisma.order.create.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        id: "order-1",
        ...data,
      })
    );
    prisma.batchSlot.findMany.mockResolvedValue([
      { id: "slot-1", cutoff_time_minutes: SLOT_MINUTES, sort_order: 0 },
    ]);
    prisma.batch.findFirst.mockResolvedValue(null);
    prisma.batch.create.mockResolvedValue({
      id: "batch-new",
      cutoff_time: SLOT_TIME,
      status: "OPEN",
    });
    prisma.batch.update.mockImplementation(
      async ({ where }: { where: { id: string } }) => ({
        id: where.id,
        shop_id: "shop-1",
        status: "OPEN",
        collective_total: "180",
        min_order_value_snapshot: "500",
      })
    );
    prisma.$queryRaw.mockImplementation(
      async (strings: TemplateStringsArray) => {
        const sql = sqlOf(strings);
        if (sql.includes("nextval")) return (nextval.shift() ?? nextval[0])();
        if (sql.includes('FROM "Batch"')) return batchLocks.shift() ?? [];
        return [];
      }
    );
    platformSettingsRepository.getPlatformFee.mockResolvedValue(2);
  });

  afterEach(() => vi.useRealTimers());

  const direct = (overrides: { payment?: "CASH" | "ONLINE" } = {}) =>
    service.createOrderFromCart(
      "user-1",
      "shop-1",
      overrides.payment ?? "CASH",
      "addr-1",
      undefined,
      undefined,
      undefined,
      "ring the bell",
      true
    );

  const byTime = (time: Date = SLOT_TIME) =>
    service.createOrderFromCart(
      "user-1",
      "shop-1",
      "CASH",
      "addr-1",
      undefined,
      time
    );

  const byBatchId = (batchId = "batch-9") =>
    service.createOrderFromCart(
      "user-1",
      "shop-1",
      "ONLINE",
      "addr-1",
      "pg-1",
      undefined,
      "upi-1",
      undefined,
      false,
      batchId
    );

  const createdOrder = () =>
    callArg<{ data: Record<string, unknown> }>(prisma.order.create).data;

  describe("getOrders", () => {
    it("pages the user's orders and reports totals", async () => {
      orderRepository.getOrdersByUserId.mockResolvedValue([
        { id: "o1" },
      ] as never);
      orderRepository.count.mockResolvedValue(21);

      const result = await service.getOrders({
        userId: "u1",
        page: 3,
        limit: 10,
      });

      expect(orderRepository.getOrdersByUserId).toHaveBeenCalledWith("u1", {
        skip: 20,
        take: 10,
        orderBy: { created_at: "desc" },
        include: orderWithDetailsInclude,
      });
      expect(orderRepository.count).toHaveBeenCalledWith({
        where: { user_id: "u1" },
      });
      expect(result).toEqual({
        orders: [{ id: "o1" }],
        totalOrders: 21,
        total_pages: 3,
        currentPage: 3,
      });
    });

    it("defaults to the first page of 10", async () => {
      orderRepository.getOrdersByUserId.mockResolvedValue([] as never);
      orderRepository.count.mockResolvedValue(0);

      const result = await service.getOrders({ userId: "u1" });

      expect(callArg(orderRepository.getOrdersByUserId, 0, 1)).toMatchObject({
        skip: 0,
        take: 10,
      });
      expect(result).toMatchObject({ total_pages: 0, currentPage: 1 });
    });
  });

  describe("createOrderFromCart argument validation", () => {
    it.each([
      [
        "direct delivery with a batch id",
        [undefined, undefined, undefined, true, "b1"],
        "Direct delivery orders cannot be scheduled or assigned to a batch.",
      ],
      [
        "direct delivery with a requested time",
        [SLOT_TIME, undefined, undefined, true, undefined],
        "Direct delivery orders cannot be scheduled or assigned to a batch.",
      ],
      [
        "batch delivery with neither batch nor time",
        [undefined, undefined, undefined, false, undefined],
        "Batch delivery orders must specify a batch ID or requested delivery time.",
      ],
      [
        "batch delivery with both batch and time",
        [SLOT_TIME, undefined, undefined, false, "b1"],
        "Provide either batch ID or requested delivery time, not both.",
      ],
    ] as const)("rejects %s", async (_label, args, message) => {
      const [time, upi, notes, isDirect, batchId] = args;

      const promise = service.createOrderFromCart(
        "user-1",
        "shop-1",
        "CASH",
        "addr-1",
        undefined,
        time,
        upi,
        notes,
        isDirect,
        batchId
      );

      await expect(promise).rejects.toThrow(new ValidationError(message));
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe("createOrderFromCart preconditions", () => {
    it.each([
      [
        "the cart is missing",
        () => prisma.cart.findUnique.mockResolvedValue(null),
        NotFoundError,
        "Cart is empty.",
      ],
      [
        "the cart has no items",
        () =>
          prisma.cart.findUnique.mockResolvedValue(buildCart({ items: [] })),
        NotFoundError,
        "Cart is empty.",
      ],
      [
        "the shop is missing",
        () => prisma.shop.findFirst.mockResolvedValue(null),
        NotFoundError,
        "Shop not found.",
      ],
      [
        "the shop is inactive",
        () =>
          prisma.shop.findFirst.mockResolvedValue(
            buildShop({ is_active: false })
          ),
        ValidationError,
        "Shop is currently not accepting orders.",
      ],
      [
        "the shop paused orders",
        () =>
          prisma.shop.findFirst.mockResolvedValue(
            buildShop({ accepting_orders: false })
          ),
        ValidationError,
        "Shop is not accepting orders at the moment. Please try again later.",
      ],
      [
        "the address is missing",
        () => prisma.userAddress.findUnique.mockResolvedValue(null),
        NotFoundError,
        "Delivery address not found.",
      ],
      [
        "the address belongs to someone else",
        () =>
          prisma.userAddress.findUnique.mockResolvedValue(
            buildAddress({ user_id: "other" })
          ),
        UnauthorizedError,
        "Address does not belong to user.",
      ],
    ])("fails when %s", async (_label, arrange, ErrorType, message) => {
      arrange();

      const promise = direct();

      await expect(promise).rejects.toBeInstanceOf(ErrorType);
      await expect(promise).rejects.toThrow(message);
      expect(prisma.order.create).not.toHaveBeenCalled();
    });

    it("checks the delivery building by id when the shop restricts buildings", async () => {
      prisma.shopDeliveryBuilding.count.mockResolvedValue(2);
      prisma.shopDeliveryBuilding.findFirst.mockResolvedValue({ id: "sdb-1" });

      await direct();

      expect(prisma.shopDeliveryBuilding.findFirst).toHaveBeenCalledWith({
        where: { shop_id: "shop-1", building_id: "bld-1", is_active: true },
        select: { id: true },
      });
      expect(prisma.order.create).toHaveBeenCalled();
    });

    it("falls back to a case-insensitive building name match", async () => {
      prisma.shopDeliveryBuilding.count.mockResolvedValue(1);
      prisma.userAddress.findUnique.mockResolvedValue(
        buildAddress({ building_id: null })
      );
      prisma.shopDeliveryBuilding.findFirst.mockResolvedValue(null);

      await expect(direct()).rejects.toThrow(
        "This shop does not deliver to the selected building."
      );
      expect(prisma.shopDeliveryBuilding.findFirst).toHaveBeenCalledWith({
        where: {
          shop_id: "shop-1",
          is_active: true,
          building: { name: { equals: "Hostel A", mode: "insensitive" } },
        },
        select: { id: true },
      });
    });

    it.each([
      ["missing", null, "Product Unknown is no longer available."],
      [
        "deleted",
        buildProduct({ deleted_at: new Date() }),
        "Product Notebook is no longer available.",
      ],
    ])("rejects a %s product", async (_label, product, message) => {
      prisma.product.findUnique.mockResolvedValue(product);

      await expect(direct()).rejects.toThrow(new ValidationError(message));
    });

    it("rejects a non-positive quantity", async () => {
      prisma.cart.findUnique.mockResolvedValue(
        buildCart({ items: [buildCartItem({ quantity: 0 })] })
      );

      await expect(direct()).rejects.toThrow(
        "Invalid quantity for product: Notebook"
      );
    });

    it("rejects when stock is lower than the requested quantity", async () => {
      prisma.product.findUnique.mockResolvedValue(
        buildProduct({ stock_quantity: 1 })
      );

      await expect(direct()).rejects.toThrow(
        "Insufficient stock for: Notebook"
      );
    });

    it("rejects carts below the shop minimum", async () => {
      prisma.shop.findFirst.mockResolvedValue(
        buildShop({ min_order_value: 500 })
      );

      await expect(direct()).rejects.toThrow(
        "Minimum order value is ₹500. Your cart total is ₹200."
      );
    });

    it("rejects when the conditional stock decrement loses a race", async () => {
      prisma.product.updateMany.mockResolvedValue({ count: 0 });

      await expect(direct()).rejects.toThrow(
        "Insufficient stock for: Notebook"
      );
      expect(prisma.cartItem.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe("createOrderFromCart direct delivery", () => {
    it("prices discounted items, applies fees and creates the order", async () => {
      prisma.cart.findUnique.mockResolvedValue(
        buildCart({
          items: [
            buildCartItem({ product_id: "prod-1", quantity: 2 }),
            buildCartItem({ id: "item-2", product_id: "prod-2", quantity: 1 }),
          ],
        })
      );
      prisma.product.findUnique.mockImplementation(
        async ({ where }: { where: { id: string } }) =>
          where.id === "prod-1"
            ? buildProduct({ price: "99.99", discount: "10" })
            : buildProduct({ name: "Pen", price: 20, discount: null })
      );

      const order = (await direct()) as CreatedOrder;

      // 9999p - 1000p discount = 8999p * 2 + 2000p = 19998p
      expect(createdOrder()).toMatchObject({
        display_id: "NITAP-001234",
        user_id: "user-1",
        shop_id: "shop-1",
        item_total: 199.98,
        delivery_fee: 25,
        platform_fee: 2,
        total_price: 226.98,
        payment_method: "CASH",
        payment_status: "PENDING",
        customer_notes: "ring the bell",
        is_direct_delivery: true,
        requested_delivery_time: undefined,
        delivery_address_snapshot: {
          hostel_block: "A",
          building: "Hostel A",
          room_number: "101",
          notes: null,
        },
        items: {
          create: [
            { product_id: "prod-1", quantity: 2, price: 89.99 },
            { product_id: "prod-2", quantity: 1, price: 20 },
          ],
        },
      });
      expect(createdOrder()).not.toHaveProperty("batch_id");
      expect(order.id).toBe("order-1");
    });

    it("locks products in sorted, de-duplicated id order", async () => {
      prisma.cart.findUnique.mockResolvedValue(
        buildCart({
          items: [
            buildCartItem({ product_id: "b", quantity: 1 }),
            buildCartItem({ product_id: "a", quantity: 1 }),
            buildCartItem({ product_id: "b", quantity: 1 }),
          ],
        })
      );

      await direct();

      const productLock = prisma.$queryRaw.mock.calls.find((c) =>
        sqlOf(c[0]).includes('FROM "Product"')
      );
      expect(productLock?.[1]).toEqual(["a", "b"]);
    });

    it("decrements stock, clears the cart and notifies the owner", async () => {
      await direct();

      expect(prisma.product.updateMany).toHaveBeenCalledWith({
        where: { id: "prod-1", stock_quantity: { gte: 2 } },
        data: { stock_quantity: { decrement: 2 } },
      });
      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cart_id: "cart-1" },
      });
      expect(notificationService.publishNotification).toHaveBeenCalledWith(
        "owner-1",
        {
          title: "New Order Received",
          message: "You have received a new order with ID: NITAP-001234",
          action_url: "/owner-shops/orders/order-1",
          type: "INFO",
          category: "ORDER",
        }
      );
      expect(prisma.batch.update).not.toHaveBeenCalled();
      expect(publishBatchProgress).not.toHaveBeenCalled();
    });

    it("marks online payments as completed", async () => {
      await direct({ payment: "ONLINE" });

      expect(createdOrder().payment_status).toBe("COMPLETED");
    });

    it("treats a missing direct delivery fee as free", async () => {
      prisma.shop.findFirst.mockResolvedValue(
        buildShop({ direct_delivery_fee: null })
      );

      await direct();

      expect(createdOrder()).toMatchObject({
        delivery_fee: 0,
        total_price: 202,
      });
    });

    it("skips the notification when the shop has no owner", async () => {
      prisma.shop.findFirst.mockResolvedValue(buildShop({ user: null }));

      await direct();

      expect(notificationService.publishNotification).not.toHaveBeenCalled();
    });

    it("still returns the order when the notification fails", async () => {
      notificationService.publishNotification.mockRejectedValue(
        new Error("queue down")
      );

      await expect(direct()).resolves.toMatchObject({ id: "order-1" });
    });
  });

  describe("display id generation", () => {
    it("creates the sequence when it is missing", async () => {
      nextval = [
        () => {
          throw new Error("relation does not exist");
        },
        () => [{ next_id: 1000n }],
      ];

      await direct();

      expect(createdOrder().display_id).toBe("NITAP-001000");
      expect(prisma.$executeRawUnsafe).toHaveBeenCalledWith(
        "ROLLBACK TO SAVEPOINT get_display_id"
      );
      expect(prisma.$executeRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining("CREATE SEQUENCE IF NOT EXISTS")
      );
    });

    it("falls back to a random 6 digit id when the sequence is unusable", async () => {
      const fail = () => {
        throw new Error("nope");
      };
      nextval = [fail, fail];

      await direct();

      expect(createdOrder().display_id).toMatch(/^NITAP-\d{6}$/);
    });
  });

  describe("createOrderFromCart with an explicit batch id", () => {
    it("links an open, unexpired batch and publishes its progress", async () => {
      batchLocks = [
        [
          {
            id: "batch-9",
            status: "OPEN",
            cutoff_time: FUTURE_CUTOFF.toISOString(),
          },
        ],
      ];

      await byBatchId();

      expect(createdOrder()).toMatchObject({
        batch_id: "batch-9",
        requested_delivery_time: FUTURE_CUTOFF,
        payment_status: "COMPLETED",
        pg_payment_id: "pg-1",
        upi_transaction_id: "upi-1",
        delivery_fee: 10,
        is_direct_delivery: false,
      });
      expect(prisma.batch.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "batch-9" },
          data: { collective_total: { increment: 200 } },
        })
      );
      expect(publishBatchProgress).toHaveBeenCalledWith({
        batchId: "batch-9",
        shopId: "shop-1",
        status: "OPEN",
        collectiveTotal: 180,
        minRequired: 500,
      });
    });

    it("publishes a null minimum when the batch has no snapshot", async () => {
      batchLocks = [
        [{ id: "batch-9", status: "OPEN", cutoff_time: FUTURE_CUTOFF }],
      ];
      prisma.batch.update.mockResolvedValue({
        id: "batch-9",
        shop_id: "shop-1",
        status: "OPEN",
        collective_total: 200,
        min_order_value_snapshot: null,
      });

      await byBatchId();

      expect(publishBatchProgress).toHaveBeenCalledWith(
        expect.objectContaining({ minRequired: null, collectiveTotal: 200 })
      );
    });

    it.each([
      ["does not exist", [], "The selected batch does not exist."],
      [
        "is locked",
        [{ id: "batch-9", status: "LOCKED", cutoff_time: FUTURE_CUTOFF }],
        "This batch is no longer accepting orders (Status: LOCKED).",
      ],
      [
        "has expired",
        [{ id: "batch-9", status: "OPEN", cutoff_time: NOW }],
        "The selected batch has already expired.",
      ],
    ])("rejects a batch that %s", async (_label, rows, message) => {
      batchLocks = [rows as BatchRow[]];

      await expect(byBatchId()).rejects.toThrow(new ValidationError(message));
    });
  });

  describe("createOrderFromCart with a requested delivery time", () => {
    it("creates a new batch for a configured slot", async () => {
      prisma.shop.findFirst.mockResolvedValue(
        buildShop({ batch_min_order_value: "300" })
      );

      await byTime(new Date(SLOT_TIME.getTime() + 42_123));

      expect(prisma.batch.create).toHaveBeenCalledWith({
        data: {
          shop_id: "shop-1",
          cutoff_time: SLOT_TIME,
          status: "OPEN",
          slot_id: "slot-1",
          collective_total: 0,
          min_order_value_snapshot: 300,
        },
      });
      expect(prisma.$executeRawUnsafe).toHaveBeenCalledWith(
        "RELEASE SAVEPOINT batch_insert"
      );
      expect(createdOrder()).toMatchObject({
        batch_id: "batch-new",
        requested_delivery_time: SLOT_TIME,
      });
      expect(publishBatchProgress).toHaveBeenCalled();
    });

    it("snapshots a null batch minimum when the shop has none", async () => {
      await byTime();

      expect(callArg<{ data: object }>(prisma.batch.create).data).toMatchObject(
        {
          min_order_value_snapshot: null,
        }
      );
    });

    it("joins an existing open batch after re-locking it", async () => {
      prisma.batch.findFirst.mockResolvedValue({
        id: "batch-1",
        status: "OPEN",
      });
      batchLocks = [
        [{ id: "batch-1", status: "OPEN", cutoff_time: SLOT_TIME }],
      ];

      await byTime();

      expect(prisma.batch.create).not.toHaveBeenCalled();
      expect(createdOrder().batch_id).toBe("batch-1");
    });

    it("recovers from a concurrent insert by re-reading the winning batch", async () => {
      prisma.batch.create.mockRejectedValue({ code: "P2002" });
      batchLocks = [
        [{ id: "batch-race", status: "OPEN", cutoff_time: SLOT_TIME }],
      ];

      await byTime();

      expect(prisma.$executeRawUnsafe).toHaveBeenCalledWith(
        "ROLLBACK TO SAVEPOINT batch_insert"
      );
      expect(createdOrder().batch_id).toBe("batch-race");
    });

    const LOCKED_MSG =
      "This batch has already been locked. Please pick another slot or use direct delivery.";
    const CANCELLED_MSG = "This batch slot is no longer available (Cancelled).";

    it.each([
      [
        "the slot is in the past",
        () => {},
        NOW,
        "Selected batch slot is in the past",
      ],
      [
        "the shop has no slots",
        () => prisma.batchSlot.findMany.mockResolvedValue([]),
        SLOT_TIME,
        "This shop has no batch cards configured. Use direct delivery instead.",
      ],
      [
        "slot lookup fails",
        () => prisma.batchSlot.findMany.mockRejectedValue(new Error("db")),
        SLOT_TIME,
        "This shop has no batch cards configured. Use direct delivery instead.",
      ],
      [
        "no slot matches the time",
        () => {},
        new Date("2030-01-01T09:00:00Z"),
        "Selected batch slot is not available",
      ],
      [
        "the existing batch was cancelled",
        () =>
          prisma.batch.findFirst.mockResolvedValue({
            id: "b",
            status: "CANCELLED",
          }),
        SLOT_TIME,
        CANCELLED_MSG,
      ],
      [
        "the existing batch is locked",
        () =>
          prisma.batch.findFirst.mockResolvedValue({
            id: "b",
            status: "LOCKED",
          }),
        SLOT_TIME,
        LOCKED_MSG,
      ],
    ])("rejects when %s", async (_label, arrange, time, message) => {
      arrange();

      await expect(byTime(time)).rejects.toThrow(new ValidationError(message));
      expect(prisma.order.create).not.toHaveBeenCalled();
    });

    it.each([
      ["vanished", [], "The selected batch does not exist."],
      [
        "been cancelled",
        [{ id: "b", status: "CANCELLED", cutoff_time: SLOT_TIME }],
        CANCELLED_MSG,
      ],
      [
        "been locked",
        [{ id: "b", status: "LOCKED", cutoff_time: SLOT_TIME }],
        LOCKED_MSG,
      ],
    ])(
      "rejects an open batch that has %s by lock time",
      async (_l, rows, message) => {
        prisma.batch.findFirst.mockResolvedValue({ id: "b", status: "OPEN" });
        batchLocks = [rows as BatchRow[]];

        await expect(byTime()).rejects.toThrow(new ValidationError(message));
      }
    );

    it.each([
      ["vanished", [], "The selected batch does not exist."],
      [
        "been locked",
        [{ id: "b", status: "LOCKED", cutoff_time: SLOT_TIME }],
        LOCKED_MSG,
      ],
    ])(
      "rejects a race-winning batch that has %s",
      async (_l, rows, message) => {
        prisma.batch.create.mockRejectedValue({ code: "P2002" });
        batchLocks = [rows as BatchRow[]];

        await expect(byTime()).rejects.toThrow(new ValidationError(message));
      }
    );

    it.each([
      ["a non-unique error", new Error("connection reset")],
      ["a non-object error", "boom"],
    ])("rethrows %s from the batch insert", async (_label, err) => {
      prisma.batch.create.mockRejectedValue(err);

      await expect(byTime()).rejects.toBe(err);
      expect(prisma.$executeRawUnsafe).not.toHaveBeenCalledWith(
        "ROLLBACK TO SAVEPOINT batch_insert"
      );
    });
  });
});
