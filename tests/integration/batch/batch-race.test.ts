import { describe, expect, it } from "vitest";

import { createContainer } from "../../../src/di/container";
import type { Prisma, PrismaClient } from "../../../src/generated/client";
import {
  createBatchSlot,
  createShop,
  futureSlotTime,
  seedCartForShop,
} from "../../factories";
import { testPrisma } from "../../setup/integration-setup";

type TransactionOptions = {
  maxWait?: number;
  timeout?: number;
  isolationLevel?: Prisma.TransactionIsolationLevel;
};

function withP2002Observer(
  client: PrismaClient,
  onP2002: () => void
): PrismaClient {
  return new Proxy(client, {
    get(target, prop, receiver) {
      if (prop === "$transaction") {
        return (arg: unknown, opts?: TransactionOptions) => {
          if (typeof arg !== "function") {
            const original = Reflect.get(target, prop, receiver) as (
              ...passthroughArgs: unknown[]
            ) => unknown;
            return original.call(target, arg, opts);
          }
          const fn = arg as (tx: Prisma.TransactionClient) => Promise<unknown>;
          return target.$transaction(async (tx) => {
            const wrappedTx = new Proxy(tx, {
              get(txTarget, txProp, txReceiver) {
                if (txProp === "batch") {
                  const batchDelegate = Reflect.get(
                    txTarget,
                    txProp,
                    txReceiver
                  );
                  return new Proxy(batchDelegate, {
                    get(bTarget, bProp, bReceiver) {
                      if (bProp === "create") {
                        const createFn = Reflect.get(
                          bTarget,
                          bProp,
                          bReceiver
                        ) as (...createArgs: unknown[]) => Promise<unknown>;
                        return async (...createArgs: unknown[]) => {
                          try {
                            return await createFn.apply(bTarget, createArgs);
                          } catch (err: unknown) {
                            if (
                              typeof err === "object" &&
                              err !== null &&
                              (err as { code?: string }).code === "P2002"
                            ) {
                              onP2002();
                            }
                            throw err;
                          }
                        };
                      }
                      return Reflect.get(bTarget, bProp, bReceiver);
                    },
                  });
                }
                return Reflect.get(txTarget, txProp, txReceiver);
              },
            });
            return fn(wrappedTx);
          }, opts);
        };
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}

async function raceTwoCheckoutsAtSameCutoff() {
  const { at, cutoffMinutes } = futureSlotTime();

  const shop = await createShop({ accepting_orders: true });
  await createBatchSlot({
    shop_id: shop.id,
    cutoff_time_minutes: cutoffMinutes,
    is_active: true,
  });

  const a = await seedCartForShop(shop);
  const b = await seedCartForShop(shop);

  let p2002Hits = 0;
  const observedPrisma = withP2002Observer(testPrisma, () => {
    p2002Hits += 1;
  });

  const { orderService } = createContainer({ prisma: observedPrisma });

  const results = await Promise.allSettled([
    orderService.createOrderFromCart(
      a.user.id,
      shop.id,
      "CASH",
      a.address.id,
      undefined,
      at
    ),
    orderService.createOrderFromCart(
      b.user.id,
      shop.id,
      "CASH",
      b.address.id,
      undefined,
      at
    ),
  ]);

  return { shop, a, b, results, getP2002Hits: () => p2002Hits };
}

describe("findOrCreateBatchForRequestedTime - concurrent checkouts", () => {
  it("never creates more than one Batch row when two checkouts race on the same cutoff, and any rejection is the known transaction-abort failure", async () => {
    const { shop, results, getP2002Hits } =
      await raceTwoCheckoutsAtSameCutoff();

    let fulfilledCount = 0;
    let rejectedCount = 0;

    const batches = await testPrisma.batch.findMany({
      where: { shop_id: shop.id },
    });
    expect(batches).toHaveLength(1);
    expect(batches[0].status).toBe("OPEN");

    for (const r of results) {
      if (r.status === "fulfilled") {
        fulfilledCount += 1;
        expect(r.value.batch_id).toBe(batches[0].id);
      } else {
        rejectedCount += 1;
        const reason = r.reason as unknown;
        const message =
          reason instanceof Error ? reason.message : String(reason);
        expect(message).toMatch(/current transaction is aborted|25P02/i);
      }
    }

    const attachedOrders = await testPrisma.order.findMany({
      where: { batch_id: batches[0].id },
    });
    expect(attachedOrders).toHaveLength(fulfilledCount);

    expect(fulfilledCount).toBeGreaterThanOrEqual(1);

    if (rejectedCount > 0) {
      expect(getP2002Hits()).toBeGreaterThanOrEqual(1);
    }
  });
  it("once order.service.ts uses a SAVEPOINT around the insert, both racing checkouts succeed and attach to the single batch", async () => {
    const { shop, a, b, results } = await raceTwoCheckoutsAtSameCutoff();

    expect(results.every((r) => r.status === "fulfilled")).toBe(true);

    const batches = await testPrisma.batch.findMany({
      where: { shop_id: shop.id },
    });
    expect(batches).toHaveLength(1);

    const orders = await testPrisma.order.findMany({
      where: { batch_id: batches[0].id },
    });
    expect(orders).toHaveLength(2);
    expect(orders.map((o) => o.user_id).sort()).toEqual(
      [a.user.id, b.user.id].sort()
    );
  });
});
