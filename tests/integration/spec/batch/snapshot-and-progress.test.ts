// Rule-based tests for threshold snapshot immutability and the
// GET /api/shops/[shop_id]/batch-progress contract (spec: "Data model",
// "Threshold snapshot immutability", "Realtime progress").
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { GET as getProgress } from "../../../../src/app/api/shops/[shop_id]/batch-progress/route";
import { BatchService as WorkerBatchService } from "../../../../workers/services/batch.service";
import { createShop } from "../../../factories";
import {
  batchOf,
  expireBatch,
  placeOrder,
  seedBatchShop,
} from "../../../helpers/spec-batch";
import { testPrisma } from "../../../setup/integration-setup";

async function progress(shopId: string) {
  const res = await getProgress(
    new NextRequest(`http://localhost/api/shops/${shopId}/batch-progress`),
    { params: Promise.resolve({ shop_id: shopId }) }
  );
  return { status: res.status, body: await res.json() };
}

function worker() {
  return new WorkerBatchService(
    { publishNotification: async () => {} } as never,
    testPrisma as never,
    { tryAcquire: async () => false } as never
  );
}

describe("threshold snapshot immutability", () => {
  it("RULE B3: raising the shop threshold mid-batch leaves the open batch's snapshot and cutoff outcome unchanged", async () => {
    const { shop, at } = await seedBatchShop({ min: 200 });
    const { order } = await placeOrder(shop.id, at, { price: 250 });
    await testPrisma.shop.update({
      where: { id: shop.id },
      data: { batch_min_order_value: 10_000 },
    });
    await placeOrder(shop.id, at, { price: 10 });

    const batch = await batchOf(order.batch_id!);
    expect(Number(batch.min_order_value_snapshot)).toBe(200);

    const { body } = await progress(shop.id);
    expect(body.data).toMatchObject({ minRequired: 200, isMet: true });

    await expireBatch(batch.id);
    await worker().autoCloseExpiredBatches();
    expect((await batchOf(batch.id)).status).toBe("LOCKED");
  });

  it("RULE B4: a batch created after the threshold change snapshots the new value", async () => {
    const first = await seedBatchShop({ min: 200, offsetMinutes: 120 });
    const a = await placeOrder(first.shop.id, first.at);
    await testPrisma.shop.update({
      where: { id: first.shop.id },
      data: { batch_min_order_value: 900 },
    });
    await testPrisma.batch.update({
      where: { id: a.order.batch_id! },
      data: { status: "LOCKED" },
    });
    // A second slot later in the day opens a new batch.
    const later = new Date(first.at.getTime() + 60 * 60_000);
    const { getZonedParts, APP_TIME_ZONE } =
      await import("../../../../src/lib/utils/timezone");
    const z = getZonedParts(later, APP_TIME_ZONE);
    await testPrisma.batchSlot.create({
      data: {
        shop_id: first.shop.id,
        cutoff_time_minutes: z.hour * 60 + z.minute,
        is_active: true,
      },
    });
    const b = await placeOrder(first.shop.id, later);

    expect(b.order.batch_id).not.toBe(a.order.batch_id);
    expect(
      Number((await batchOf(b.order.batch_id!)).min_order_value_snapshot)
    ).toBe(900);
    expect(
      Number((await batchOf(a.order.batch_id!)).min_order_value_snapshot)
    ).toBe(200);
  });

  it("RULE B5: enabling a threshold mid-batch does not retroactively apply it to a batch created with the feature off", async () => {
    const { shop, at } = await seedBatchShop({ min: null });
    const { order } = await placeOrder(shop.id, at, { price: 50 });
    await testPrisma.shop.update({
      where: { id: shop.id },
      data: { batch_min_order_value: 5000 },
    });

    const { body } = await progress(shop.id);
    expect(body.data).toMatchObject({
      batchId: order.batch_id,
      minRequired: null,
      isMet: true,
    });

    await expireBatch(order.batch_id!);
    await worker().autoCloseExpiredBatches();
    expect((await batchOf(order.batch_id!)).status).toBe("LOCKED");
  });
});

describe("GET /api/shops/[shop_id]/batch-progress", () => {
  it("RULE B30: with the feature off it returns minRequired null and isMet true", async () => {
    const { shop, at } = await seedBatchShop({ min: null });
    const { order } = await placeOrder(shop.id, at, { price: 80 });
    const { status, body } = await progress(shop.id);

    expect(status).toBe(200);
    expect(body.data).toMatchObject({
      batchId: order.batch_id,
      status: "OPEN",
      collectiveTotal: 80,
      minRequired: null,
      isMet: true,
    });
  });

  it("RULE B31: returns the documented shape; isMet is false below and true at the threshold", async () => {
    const { shop, at } = await seedBatchShop({ min: 300 });
    const { order } = await placeOrder(shop.id, at, { price: 120 });
    let { body } = await progress(shop.id);

    expect(Object.keys(body.data).sort()).toEqual(
      [
        "batchId",
        "collectiveTotal",
        "cutoffTime",
        "isMet",
        "minRequired",
        "status",
      ].sort()
    );
    expect(body.data).toMatchObject({
      batchId: order.batch_id,
      collectiveTotal: 120,
      minRequired: 300,
      isMet: false,
      cutoffTime: at.toISOString(),
    });

    await placeOrder(shop.id, at, { price: 180 });
    ({ body } = await progress(shop.id));
    expect(body.data).toMatchObject({ collectiveTotal: 300, isMet: true });
  });

  it("RULE B32: a PENDING_REVIEW batch is still the shop's current batch", async () => {
    const { shop, at } = await seedBatchShop({ min: 1000 });
    const { order } = await placeOrder(shop.id, at, { price: 100 });
    await testPrisma.batch.update({
      where: { id: order.batch_id! },
      data: { status: "PENDING_REVIEW" },
    });
    const { body } = await progress(shop.id);

    expect(body.data).toMatchObject({
      batchId: order.batch_id,
      status: "PENDING_REVIEW",
      collectiveTotal: 100,
      minRequired: 1000,
      isMet: false,
    });
  });

  it("RULE B32: CANCELLED and COMPLETED batches are never reported as current", async () => {
    const shop = await createShop({ batch_min_order_value: 500 });
    for (const status of ["CANCELLED", "COMPLETED"] as const) {
      await testPrisma.batch.create({
        data: {
          shop_id: shop.id,
          cutoff_time: new Date(
            Date.now() + (status === "CANCELLED" ? 1 : 2) * 3600_000
          ),
          status,
          collective_total: 400,
          min_order_value_snapshot: 500,
        },
      });
    }
    const { body } = await progress(shop.id);

    expect(body.data).toMatchObject({
      batchId: null,
      status: null,
      collectiveTotal: 0,
    });
  });

  it("RULE B32: after a rollover the new OPEN batch is reported, not the just-closed one", async () => {
    const shop = await createShop({ batch_min_order_value: 500 });
    await testPrisma.batch.create({
      data: {
        shop_id: shop.id,
        cutoff_time: new Date(Date.now() - 3600_000),
        status: "LOCKED",
        collective_total: 900,
        min_order_value_snapshot: 500,
      },
    });
    const open = await testPrisma.batch.create({
      data: {
        shop_id: shop.id,
        cutoff_time: new Date(Date.now() + 3600_000),
        status: "OPEN",
        collective_total: 40,
        min_order_value_snapshot: 500,
      },
    });
    const { body } = await progress(shop.id);

    expect(body.data).toMatchObject({ batchId: open.id, collectiveTotal: 40 });
  });

  it("RULE B33: progress is isolated per shop", async () => {
    const a = await seedBatchShop({ min: 1000 });
    const b = await seedBatchShop({ min: 2000 });
    const oa = await placeOrder(a.shop.id, a.at, { price: 300 });
    await placeOrder(b.shop.id, b.at, { price: 50 });

    const pa = (await progress(a.shop.id)).body.data;
    const pb = (await progress(b.shop.id)).body.data;
    expect(pa).toMatchObject({
      batchId: oa.order.batch_id,
      collectiveTotal: 300,
      minRequired: 1000,
    });
    expect(pb.batchId).not.toBe(pa.batchId);
    expect(pb).toMatchObject({ collectiveTotal: 50, minRequired: 2000 });
  });

  it("RULE B34: an unknown shop is a 404", async () => {
    const { status, body } = await progress("no-such-shop");
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });
});
