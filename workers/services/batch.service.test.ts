import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { publishBatchProgress } from "../lib/batch-progress-publisher.js";
import { loggers } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";
import { BatchService } from "./batch.service.js";
import type { NotificationService } from "./notification.service.js";

vi.mock("../lib/logger.js", async () =>
  (await import("../../tests/helpers/workers/index.js")).loggerModule()
);
vi.mock("../lib/batch-progress-publisher.js", () => ({
  publishBatchProgress: vi.fn(),
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
  const service = new BatchService(
    notifications as unknown as NotificationService,
    db as unknown as typeof prisma
  );
  return { service, db, tx, notifications };
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
      expiredBatches: [expired("b2"), expired("b1")],
      locked: [row("b1", 500, null), row("b2", 800, 600)],
      counts: [
        { batch_id: "b1", _count: { id: 2 } },
        { batch_id: "b2", _count: { id: 5 } },
      ],
    });

    await service.autoCloseExpiredBatches();

    expect(tx.batch.updateMany).toHaveBeenCalledTimes(1);
    expect(tx.batch.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["b1", "b2"] } },
      data: { status: "LOCKED" },
    });
    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
    expect(tx.order.groupBy).toHaveBeenCalledWith({
      by: ["batch_id"],
      where: { batch_id: { in: ["b1", "b2"] }, order_status: "BATCHED" },
      _count: { id: true },
    });
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
        "Batch for Shop b1 is ₹150 short of its collective minimum. Decide whether to proceed or cancel.",
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

  it("skips progress for locked rows it cannot map to a shop", async () => {
    const { service } = setup({
      expiredBatches: [expired("b1")],
      locked: [row("ghost", 1, null)],
    });

    await service.autoCloseExpiredBatches();

    expect(publishBatchProgress).not.toHaveBeenCalled();
  });

  it("does not notify for locked batches without active orders", async () => {
    const { service, notifications } = setup({
      expiredBatches: [expired("b1")],
      locked: [row("b1", 0, null)],
      counts: [{ batch_id: null, _count: { id: 3 } }],
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

  it.each([
    ["locked", row("b1", 10, null)],
    ["pending-review", row("b1", 1, 10)],
  ])(
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
    ["locked", row("b1", 10, null), "Failed to publish batch notification"],
    [
      "pending-review",
      row("b1", 1, 10),
      "Failed to publish pending-review notification",
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
