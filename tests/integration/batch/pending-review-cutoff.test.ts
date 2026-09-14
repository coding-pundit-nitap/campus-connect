import { describe, expect, it } from "vitest";

import { createContainer } from "../../../src/di/container";
import { createShop, seedCartForShop } from "../../factories";
import { testPrisma } from "../../setup/integration-setup";

describe("autoCloseExpiredBatches with a collective minimum", () => {
  it("transitions an under-threshold expired batch to PENDING_REVIEW instead of LOCKED", async () => {
    const shop = await createShop({ accepting_orders: true, batch_min_order_value: 10000 });
    const pastCutoff = new Date(Date.now() - 60_000);
    const batch = await testPrisma.batch.create({
      data: {
        shop_id: shop.id,
        cutoff_time: pastCutoff,
        status: "OPEN",
        collective_total: 100,
        min_order_value_snapshot: 10000,
      },
    });
    const a = await seedCartForShop(shop);
    await testPrisma.order.create({
      data: {
        display_id: "NITAP-TEST01",
        user_id: a.user.id,
        shop_id: shop.id,
        batch_id: batch.id,
        item_total: 100,
        total_price: 100,
        payment_method: "CASH",
        order_status: "NEW",
        delivery_address_snapshot: {},
      },
    });

    const { batchService } = createContainer({ prisma: testPrisma });
    await batchService.autoCloseExpiredBatches();

    const updated = await testPrisma.batch.findUnique({ where: { id: batch.id } });
    expect(updated!.status).toBe("PENDING_REVIEW");

    const order = await testPrisma.order.findFirst({ where: { batch_id: batch.id } });
    expect(order!.order_status).toBe("NEW");
  });

  it("locks an at-or-above-threshold expired batch exactly as before", async () => {
    const shop = await createShop({ accepting_orders: true, batch_min_order_value: 50 });
    const pastCutoff = new Date(Date.now() - 60_000);
    const batch = await testPrisma.batch.create({
      data: {
        shop_id: shop.id,
        cutoff_time: pastCutoff,
        status: "OPEN",
        collective_total: 100,
        min_order_value_snapshot: 50,
      },
    });
    await testPrisma.order.create({
      data: {
        display_id: "NITAP-TEST02",
        shop_id: shop.id,
        batch_id: batch.id,
        item_total: 100,
        total_price: 100,
        payment_method: "CASH",
        order_status: "NEW",
        delivery_address_snapshot: {},
      },
    });

    const { batchService } = createContainer({ prisma: testPrisma });
    await batchService.autoCloseExpiredBatches();

    const updated = await testPrisma.batch.findUnique({ where: { id: batch.id } });
    expect(updated!.status).toBe("LOCKED");

    const order = await testPrisma.order.findFirst({ where: { batch_id: batch.id } });
    expect(order!.order_status).toBe("BATCHED");
  });

  it("locks an expired batch unconditionally when no collective minimum is configured", async () => {
    const shop = await createShop({ accepting_orders: true });
    const pastCutoff = new Date(Date.now() - 60_000);
    const batch = await testPrisma.batch.create({
      data: {
        shop_id: shop.id,
        cutoff_time: pastCutoff,
        status: "OPEN",
        collective_total: 0,
        min_order_value_snapshot: null,
      },
    });

    const { batchService } = createContainer({ prisma: testPrisma });
    await batchService.autoCloseExpiredBatches();

    const updated = await testPrisma.batch.findUnique({ where: { id: batch.id } });
    expect(updated!.status).toBe("LOCKED");
  });
});
