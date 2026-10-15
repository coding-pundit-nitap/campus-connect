import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { publishBatchProgress } from "../lib/batch-progress-publisher.js";
import { loggers } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";
import { BatchService, formatRupees } from "./batch.service.js";
import type { NotificationService } from "./notification.service.js";

vi.mock("../lib/logger.js", async () =>
  (await import("../../tests/helpers/workers/index.js")).loggerModule()
);
vi.mock("../lib/batch-progress-publisher.js", () => ({
  publishBatchProgress: vi.fn(),
}));
vi.mock("../lib/reminder-gate.js", () => ({
  createRedisReminderGate: vi.fn(() => ({
    tryAcquire: vi.fn().mockResolvedValue(true),
  })),
}));
vi.mock("../lib/prisma.js", () => ({
  prisma: { batch: { findMany: vi.fn().mockResolvedValue([]) } },
}));

const NOW = new Date("2026-03-01T12:00:00.000Z");

interface ExpiredBatch {
  id: string;
  shop_id: string;
  shop: { name: string; user: { id: string } | null };
  orders: { id: string }[];
}
interface LockedRow {
  id: string;
  status: string;
  collective_total: string;
  min_order_value_snapshot: string | null;
}

const expired = (
  id: string,
  overrides: Partial<ExpiredBatch> = {}
): ExpiredBatch => ({
  id,
  shop_id: `shop-${id}`,
  shop: { name: `Shop ${id}`, user: { id: `owner-${id}` } },
  orders: [{ id: `order-${id}` }],
  ...overrides,
});

const row = (
  id: string,
  collective: number,
  min: number | null
): LockedRow => ({
  id,
  status: "OPEN",
  collective_total: String(collective),
  min_order_value_snapshot: min === null ? null : String(min),
});

function setup({
  expiredBatches = [] as ExpiredBatch[],
  locked = [] as LockedRow[],
  counts = [] as { batch_id: string | null; _count: { id: number } }[],
  stale = [] as unknown[],
} = {}) {
  const tx = {
    $queryRaw: vi.fn().mockResolvedValue(locked),
    $executeRaw: vi.fn(),
    batch: { updateMany: vi.fn() },
    order: { groupBy: vi.fn().mockResolvedValue(counts) },
  };
  const db = {
    batch: {
      findMany: vi
        .fn()
        .mockResolvedValueOnce(expiredBatches)
        .mockResolvedValueOnce(stale),
    },
    $transaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
  };
  const notifications = { publishNotification: vi.fn() };
  const gate = { tryAcquire: vi.fn().mockResolvedValue(true) };
  const service = new BatchService(
    notifications as unknown as NotificationService,
    db as unknown as typeof prisma,
    gate
  );
  return { service, db, tx, notifications, gate };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});
afterEach(() => {
  vi.useRealTimers();
});

describe("BatchService.autoCloseExpiredBatches — expired OPEN batches", () => {
  it("does nothing beyond the two lookups when no batches expired", async () => {
    const { service, db, notifications } = setup();

    await service.autoCloseExpiredBatches();

    expect(db.batch.findMany).toHaveBeenCalledTimes(2);
    expect(db.batch.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { status: "OPEN", cutoff_time: { lt: NOW } },
      })
    );
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(notifications.publishNotification).not.toHaveBeenCalled();
  });

  it("locks batches that met (or have no) minimum, batches their orders and notifies owners", async () => {
    const { service, tx, notifications } = setup({
      expiredBatches: [
        expired("b2", {
          orders: [1, 2, 3, 4, 5].map((n) => ({ id: `order-b2-${n}` })),
        }),
        expired("b1", { orders: [{ id: "order-b1" }, { id: "order-b1-2" }] }),
      ],
      locked: [row("b1", 500, null), row("b2", 800, 600)],
    });

    await service.autoCloseExpiredBatches();

    expect(tx.batch.updateMany).toHaveBeenCalledTimes(1);
    expect(tx.batch.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["b1", "b2"] } },
      data: { status: "LOCKED" },
    });
    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
    const sql = (tx.$executeRaw.mock.calls[0][0] as string[]).join("?");
    expect(sql).toContain(`SET order_status = 'BATCHED'`);
    expect(sql).toContain("delivery_otp");
    expect(sql).toContain(`AND order_status = 'NEW'`);
    expect(tx.$executeRaw.mock.calls[0][1]).toEqual(["b1", "b2"]);
    expect(notifications.publishNotification).toHaveBeenCalledWith("owner-b1", {
      title: "🚀 Batch Ready!",
      message: "Batch for Shop b1 is ready with 2 orders. Start preparing!",
      type: "SUCCESS",
      category: "ORDER",
      action_url: "/owner-shops/orders/order-b1",
    });
    expect(notifications.publishNotification).toHaveBeenCalledWith(
      "owner-b2",
      expect.objectContaining({
        message: "Batch for Shop b2 is ready with 5 orders. Start preparing!",
      })
    );
  });

  it("looks up expired OPEN batches with their shop owner and NEW orders", async () => {
    const { service, db } = setup();

    await service.autoCloseExpiredBatches();

    expect(db.batch.findMany).toHaveBeenNthCalledWith(1, {
      where: { status: "OPEN", cutoff_time: { lt: NOW } },
      select: {
        id: true,
        shop_id: true,
        shop: { select: { name: true, user: { select: { id: true } } } },
        orders: { where: { order_status: "NEW" }, select: { id: true } },
      },
    });
  });

  it("auto-locks a batch whose total is exactly its minimum", async () => {
    const { service, tx } = setup({
      expiredBatches: [expired("b1")],
      locked: [row("b1", 500, 500)],
    });

    await service.autoCloseExpiredBatches();

    expect(tx.batch.updateMany).toHaveBeenCalledTimes(1);
    expect(tx.batch.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["b1"] } },
      data: { status: "LOCKED" },
    });
    expect(publishBatchProgress).toHaveBeenCalledWith(
      expect.objectContaining({ status: "LOCKED", minRequired: 500 })
    );
  });

  it("parks a batch one paisa short of its minimum and states the paise", async () => {
    const { service, tx, notifications } = setup({
      expiredBatches: [expired("b1")],
      locked: [row("b1", 499.99, 500)],
    });

    await service.autoCloseExpiredBatches();

    expect(tx.batch.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["b1"] } },
      data: { status: "PENDING_REVIEW" },
    });
    expect(notifications.publishNotification).toHaveBeenCalledWith(
      "owner-b1",
      expect.objectContaining({
        message: expect.stringContaining("₹0.01 short"),
      })
    );
  });

  it("treats a null snapshot as no requirement: locks even a zero total and reports minRequired null", async () => {
    const { service } = setup({
      expiredBatches: [expired("b1")],
      locked: [row("b1", 0, null)],
    });

    await service.autoCloseExpiredBatches();

    expect(publishBatchProgress).toHaveBeenCalledWith({
      batchId: "b1",
      shopId: "shop-b1",
      status: "LOCKED",
      collectiveTotal: 0,
      minRequired: null,
    });
  });

  it("treats a zero snapshot as a met requirement", async () => {
    const { service } = setup({
      expiredBatches: [expired("b1")],
      locked: [row("b1", 0, 0)],
    });

    await service.autoCloseExpiredBatches();

    expect(publishBatchProgress).toHaveBeenCalledWith(
      expect.objectContaining({ status: "LOCKED", minRequired: 0 })
    );
  });

  it("sorts batch ids before locking to keep a stable lock order", async () => {
    const { service, tx } = setup({
      expiredBatches: [expired("c"), expired("a"), expired("b")],
    });

    await service.autoCloseExpiredBatches();

    expect(tx.$queryRaw.mock.calls[0].slice(1)).toEqual([
      expect.objectContaining({ values: ["a", "b", "c"] }),
    ]);
  });

  it("publishes LOCKED progress snapshots per batch", async () => {
    const { service } = setup({
      expiredBatches: [expired("b1")],
      locked: [row("b1", 700, 500)],
      counts: [{ batch_id: "b1", _count: { id: 1 } }],
    });

    await service.autoCloseExpiredBatches();

    expect(publishBatchProgress).toHaveBeenCalledWith({
      batchId: "b1",
      shopId: "shop-b1",
      status: "LOCKED",
      collectiveTotal: 700,
      minRequired: 500,
    });
  });

  it("moves batches short of their minimum to PENDING_REVIEW and warns the owner", async () => {
    const { service, tx, notifications } = setup({
      expiredBatches: [expired("b1")],
      locked: [row("b1", 349.6, 500)],
    });

    await service.autoCloseExpiredBatches();

    expect(tx.batch.updateMany).toHaveBeenCalledTimes(1);
    expect(tx.batch.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["b1"] } },
      data: { status: "PENDING_REVIEW" },
    });
    expect(tx.$executeRaw).not.toHaveBeenCalled();
    expect(tx.order.groupBy).not.toHaveBeenCalled();
    expect(publishBatchProgress).toHaveBeenCalledWith({
      batchId: "b1",
      shopId: "shop-b1",
      status: "PENDING_REVIEW",
      collectiveTotal: 349.6,
      minRequired: 500,
    });
    expect(notifications.publishNotification).toHaveBeenCalledWith("owner-b1", {
      title: "⚠️ Batch Below Minimum",
      message:
        "Batch for Shop b1 is ₹150.40 short of its collective minimum. Decide whether to proceed or cancel.",
      type: "WARNING",
      category: "ORDER",
      action_url: "/owner-shops/orders/order-b1",
    });
  });

  it("handles a mix of locked and pending-review batches in one run", async () => {
    const { service, tx, notifications } = setup({
      expiredBatches: [expired("ok"), expired("short")],
      locked: [row("ok", 100, null), row("short", 10, 100)],
      counts: [{ batch_id: "ok", _count: { id: 1 } }],
    });

    await service.autoCloseExpiredBatches();

    expect(tx.batch.updateMany).toHaveBeenCalledTimes(2);
    expect(publishBatchProgress).toHaveBeenCalledTimes(2);
    expect(notifications.publishNotification).toHaveBeenCalledTimes(2);
  });

  it("does nothing when another worker already locked every batch", async () => {
    const { service, tx, notifications } = setup({
      expiredBatches: [expired("b1")],
      locked: [],
    });

    await service.autoCloseExpiredBatches();

    expect(tx.batch.updateMany).not.toHaveBeenCalled();
    expect(publishBatchProgress).not.toHaveBeenCalled();
    expect(notifications.publishNotification).not.toHaveBeenCalled();
  });

  it("does not notify for locked batches without active orders", async () => {
    const { service, notifications } = setup({
      expiredBatches: [expired("b1", { orders: [] })],
      locked: [row("b1", 0, null)],
    });

    await service.autoCloseExpiredBatches();

    expect(notifications.publishNotification).not.toHaveBeenCalled();
  });

  it.each([
    ["locked", row("b1", 10, null)],
    ["pending-review", row("b1", 1, 10)],
  ])("does not notify %s batches whose shop has no owner", async (_l, r) => {
    const { service, notifications } = setup({
      expiredBatches: [expired("b1", { shop: { name: "Orphan", user: null } })],
      locked: [r],
      counts: [{ batch_id: "b1", _count: { id: 1 } }],
    });

    await service.autoCloseExpiredBatches();

    expect(notifications.publishNotification).not.toHaveBeenCalled();
  });

  it.each([["pending-review", row("b1", 1, 10)]])(
    "links %s notifications to the shop dashboard when the batch has no NEW orders",
    async (_l, r) => {
      const { service, notifications } = setup({
        expiredBatches: [expired("b1", { orders: [] })],
        locked: [r],
        counts: [{ batch_id: "b1", _count: { id: 1 } }],
      });

      await service.autoCloseExpiredBatches();

      expect(notifications.publishNotification).toHaveBeenCalledWith(
        "owner-b1",
        expect.objectContaining({ action_url: "/owner-shops" })
      );
    }
  );

  it.each([
    ["locked", row("b1", 10, null), "Failed to publish cutoff notification"],
    [
      "pending-review",
      row("b1", 1, 10),
      "Failed to publish cutoff notification",
    ],
  ])(
    "logs %s notification failures and keeps going",
    async (_l, r, message) => {
      const failure = new Error("queue down");
      const { service, notifications } = setup({
        expiredBatches: [expired("b1")],
        locked: [r],
        counts: [{ batch_id: "b1", _count: { id: 1 } }],
      });
      notifications.publishNotification.mockRejectedValue(failure);

      await expect(service.autoCloseExpiredBatches()).resolves.toBeUndefined();

      expect(loggers.batch.error).toHaveBeenCalledWith(
        { err: failure, batchId: "b1" },
        message
      );
    }
  );

  it("propagates transaction failures", async () => {
    const { service, db } = setup({ expiredBatches: [expired("b1")] });
    db.$transaction.mockRejectedValue(new Error("deadlock"));

    await expect(service.autoCloseExpiredBatches()).rejects.toThrow("deadlock");
  });
});

describe("BatchService.autoCloseExpiredBatches — stale LOCKED batches", () => {
  const staleBatch = (overrides: Record<string, unknown> = {}) => ({
    id: "s1",
    cutoff_time: new Date(NOW.getTime() - 45 * 60_000),
    shop: { name: "Stale Shop", user: { id: "owner-s1" } },
    orders: [{ id: "o1" }, { id: "o2" }],
    ...overrides,
  });

  it("looks up batches locked for more than 30 minutes with BATCHED orders", async () => {
    const { service, db } = setup();

    await service.autoCloseExpiredBatches();

    expect(db.batch.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: {
          status: "LOCKED",
          cutoff_time: { lt: new Date(NOW.getTime() - 30 * 60_000) },
          orders: { some: { order_status: "BATCHED" } },
        },
      })
    );
  });

  it("nags the owner with how long the orders have waited", async () => {
    const { service, notifications } = setup({ stale: [staleBatch()] });

    await service.autoCloseExpiredBatches();

    expect(notifications.publishNotification).toHaveBeenCalledWith("owner-s1", {
      title: "⚠️ Orders Waiting!",
      message:
        "You have 2 orders waiting for 45 mins! Start delivery NOW or they will be cancelled.",
      type: "WARNING",
      category: "ORDER",
      action_url: "/owner-shops/orders/o1",
    });
  });

  it.each([
    ["has no owner", { shop: { name: "x", user: null } }],
    ["has no orders", { orders: [] }],
  ])("skips a stale batch that %s", async (_l, overrides) => {
    const { service, notifications } = setup({
      stale: [staleBatch(overrides)],
    });

    await service.autoCloseExpiredBatches();

    expect(notifications.publishNotification).not.toHaveBeenCalled();
  });

  it("reminds at most once per 30 minutes per batch", async () => {
    const { service, notifications, gate } = setup({ stale: [staleBatch()] });

    await service.autoCloseExpiredBatches();

    expect(gate.tryAcquire).toHaveBeenCalledWith("stale-batch:s1", 30 * 60);
    expect(notifications.publishNotification).toHaveBeenCalledTimes(1);
  });

  it("skips the reminder while the previous one is still in its window", async () => {
    const { service, notifications, gate } = setup({
      stale: [staleBatch(), staleBatch({ id: "s2" })],
    });
    gate.tryAcquire.mockResolvedValueOnce(false);

    await service.autoCloseExpiredBatches();

    expect(notifications.publishNotification).toHaveBeenCalledTimes(1);
    expect(gate.tryAcquire).toHaveBeenCalledWith("stale-batch:s2", 30 * 60);
  });

  it("still sends the reminder when the gate errors (fail open)", async () => {
    const failure = new Error("redis down");
    const { service, notifications, gate } = setup({ stale: [staleBatch()] });
    gate.tryAcquire.mockRejectedValueOnce(failure);

    await service.autoCloseExpiredBatches();

    expect(loggers.batch.warn).toHaveBeenCalledWith(
      { err: failure, batchId: "s1" },
      "Reminder gate unavailable; sending stale notification"
    );
    expect(notifications.publishNotification).toHaveBeenCalledTimes(1);
  });

  it("logs stale notification failures and keeps going", async () => {
    const failure = new Error("queue down");
    const { service, notifications } = setup({
      stale: [staleBatch(), staleBatch({ id: "s2" })],
    });
    notifications.publishNotification.mockRejectedValueOnce(failure);

    await service.autoCloseExpiredBatches();

    expect(loggers.batch.error).toHaveBeenCalledWith(
      { err: failure, batchId: "s1" },
      "Failed to publish stale notification"
    );
    expect(notifications.publishNotification).toHaveBeenCalledTimes(2);
  });
});

describe("BatchService defaults", () => {
  it("uses the shared prisma client when none is injected", async () => {
    const service = new BatchService({
      publishNotification: vi.fn(),
    } as unknown as NotificationService);

    await service.autoCloseExpiredBatches();

    expect(prisma.batch.findMany).toHaveBeenCalledTimes(2);
  });
});

describe("cutoff contracts", () => {
  it("formatRupees shows whole rupees plainly and paise to two places", () => {
    expect(formatRupees(1800)).toBe("1800");
    expect(formatRupees(180.004)).toBe("180");
    expect(formatRupees(0.4)).toBe("0.40");
  });

  it("states a whole-rupee shortfall without paise", async () => {
    const { service, notifications } = setup({
      expiredBatches: [expired("b1")],
      locked: [row("b1", 3200, 5000)],
    });

    await service.autoCloseExpiredBatches();

    expect(notifications.publishNotification).toHaveBeenCalledWith(
      "owner-b1",
      expect.objectContaining({
        message: expect.stringContaining("is ₹1800 short"),
      })
    );
  });

  it("queries stale LOCKED batches with the owner and their BATCHED orders", async () => {
    const { service, db } = setup();

    await service.autoCloseExpiredBatches();

    expect(db.batch.findMany).toHaveBeenNthCalledWith(2, {
      where: {
        status: "LOCKED",
        cutoff_time: { lt: new Date(NOW.getTime() - 30 * 60_000) },
        orders: { some: { order_status: "BATCHED" } },
      },
      select: {
        id: true,
        cutoff_time: true,
        shop: { select: { name: true, user: { select: { id: true } } } },
        orders: { where: { order_status: "BATCHED" }, select: { id: true } },
      },
    });
  });

  it("skips an ownerless stale batch without attempting a send", async () => {
    const { service, notifications, gate } = setup({
      stale: [
        {
          id: "s1",
          cutoff_time: new Date(NOW.getTime() - 45 * 60_000),
          shop: { name: "x", user: null },
          orders: [{ id: "o1" }],
        },
      ],
    });

    await service.autoCloseExpiredBatches();

    expect(gate.tryAcquire).not.toHaveBeenCalled();
    expect(notifications.publishNotification).not.toHaveBeenCalled();
    expect(loggers.batch.error).not.toHaveBeenCalled();
  });
});
