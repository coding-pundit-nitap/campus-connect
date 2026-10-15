// Tests for cutoff branching (spec: "Cutoff handling"). Production
// runs the cutoff in the worker (workers/services/batch.service.ts via
// workers/batch/batch-closer.ts), so that copy is exercised against the real
// DB. Its notification queue is replaced by a recorder; nothing else is faked.
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { GET as getNextSlot } from "../../../../src/app/api/shops/[shop_id]/next-slot/route";
import { BatchService as WorkerBatchService } from "../../../../workers/services/batch.service";
import type { NotificationService as WorkerNotificationService } from "../../../../workers/services/notification.service";
import {
  batchOf,
  expireBatch,
  placeOrder,
  seedBatchShop,
} from "../../../helpers/spec-batch";
import { testPrisma } from "../../../setup/integration-setup";

interface Sent {
  userId: string;
  title: string;
  message: string;
}

function workerService() {
  const sent: Sent[] = [];
  const notifications = {
    async publishNotification(
      userId: string,
      data: { title: string; message: string }
    ) {
      sent.push({ userId, title: data.title, message: data.message });
    },
  } as unknown as WorkerNotificationService;
  const gate = { tryAcquire: async () => false };
  const service = new WorkerBatchService(
    notifications,
    testPrisma as never,
    gate as never
  );
  return { service, sent };
}

async function expiredBatchWith(min: number | null, prices: number[]) {
  const ctx = await seedBatchShop({ min });
  let batchId = "";
  for (const price of prices) {
    const { order } = await placeOrder(ctx.shop.id, ctx.at, { price });
    batchId = order.batch_id!;
  }
  await expireBatch(batchId);
  return { ...ctx, batchId };
}

async function orderStatuses(batchId: string) {
  const orders = await testPrisma.order.findMany({
    where: { batch_id: batchId },
  });
  return orders.map((o) => o.order_status);
}

describe("worker cutoff branching", () => {
  it("a batch with no threshold snapshot auto-locks at cutoff", async () => {
    const { batchId } = await expiredBatchWith(null, [40]);
    const { service } = workerService();
    await service.autoCloseExpiredBatches();

    expect((await batchOf(batchId)).status).toBe("LOCKED");
    expect(await orderStatuses(batchId)).toEqual(["BATCHED"]);
  });

  it("a batch exactly at its threshold auto-locks", async () => {
    const { batchId } = await expiredBatchWith(300, [100, 200]);
    const { service } = workerService();
    await service.autoCloseExpiredBatches();

    expect((await batchOf(batchId)).status).toBe("LOCKED");
    expect(await orderStatuses(batchId)).toEqual(["BATCHED", "BATCHED"]);
  });

  it("a batch above its threshold auto-locks and the owner gets the normal 'Batch Ready' notice", async () => {
    const { owner, batchId } = await expiredBatchWith(250, [100, 200]);
    const { service, sent } = workerService();
    await service.autoCloseExpiredBatches();

    expect((await batchOf(batchId)).status).toBe("LOCKED");
    expect(sent.filter((s) => s.userId === owner.id)).toHaveLength(1);
    expect(sent[0].title).toMatch(/ready/i);
  });

  it("a batch below its threshold goes to PENDING_REVIEW, keeps its orders, and the owner is told the shortfall", async () => {
    const { owner, batchId } = await expiredBatchWith(5000, [1200, 2000]);
    const { service, sent } = workerService();
    await service.autoCloseExpiredBatches();

    const batch = await batchOf(batchId);
    expect(batch.status).toBe("PENDING_REVIEW");
    expect(Number(batch.collective_total)).toBe(3200);
    expect(await orderStatuses(batchId)).toEqual(["NEW", "NEW"]);

    const toOwner = sent.filter((s) => s.userId === owner.id);
    expect(toOwner).toHaveLength(1);
    expect(toOwner[0].message).toContain("1800");
  });

  it("a fractional shortfall is stated as a non-zero amount", async () => {
    const { owner, batchId } = await expiredBatchWith(500, [499.6]);
    const { service, sent } = workerService();
    await service.autoCloseExpiredBatches();

    expect((await batchOf(batchId)).status).toBe("PENDING_REVIEW");
    const msg = sent.find((s) => s.userId === owner.id)!.message;
    expect(msg).not.toMatch(/₹0(?![.\d])/);
    expect(msg).toContain("0.40");
  });

  it("cutoff never auto-cancels an under-threshold batch", async () => {
    const { batchId } = await expiredBatchWith(5000, [10]);
    const { service } = workerService();
    await service.autoCloseExpiredBatches();
    await service.autoCloseExpiredBatches();

    expect((await batchOf(batchId)).status).toBe("PENDING_REVIEW");
    expect(await orderStatuses(batchId)).toEqual(["NEW"]);
  });
});

describe("on-read cutoff (next-slot lookup)", () => {
  it("an expired under-threshold batch is not force-locked when a client asks for the next slot", async () => {
    const { shop, batchId } = await expiredBatchWith(5000, [100]);
    const res = await getNextSlot(
      new NextRequest(`http://localhost/api/shops/${shop.id}/next-slot`),
      { params: Promise.resolve({ shop_id: shop.id }) }
    );

    expect(res.status).toBe(200);
    expect((await batchOf(batchId)).status).toBe("PENDING_REVIEW");
    expect(await orderStatuses(batchId)).toEqual(["NEW"]);
  });

  it("an expired batch with no threshold still auto-locks on the next-slot lookup", async () => {
    const { shop, batchId } = await expiredBatchWith(null, [100]);
    await getNextSlot(
      new NextRequest(`http://localhost/api/shops/${shop.id}/next-slot`),
      { params: Promise.resolve({ shop_id: shop.id }) }
    );

    expect((await batchOf(batchId)).status).toBe("LOCKED");
  });
});
