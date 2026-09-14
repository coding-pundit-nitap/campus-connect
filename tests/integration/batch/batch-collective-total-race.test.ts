import { describe, expect, it } from "vitest";

import { createContainer } from "../../../src/di/container";
import {
  createBatchSlot,
  createShop,
  futureSlotTime,
  seedCartForShop,
} from "../../factories";
import { testPrisma } from "../../setup/integration-setup";

describe("Batch.collective_total under concurrent checkouts", () => {
  it("equals the sum of all successfully placed orders' item_total, with no lost updates", async () => {
    const { at, cutoffMinutes } = futureSlotTime();
    const shop = await createShop({
      accepting_orders: true,
      batch_min_order_value: 1000,
    });
    await createBatchSlot({
      shop_id: shop.id,
      cutoff_time_minutes: cutoffMinutes,
      is_active: true,
    });

    const a = await seedCartForShop(shop);
    const b = await seedCartForShop(shop);

    const { orderService } = createContainer({ prisma: testPrisma });

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

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);

    const batches = await testPrisma.batch.findMany({
      where: { shop_id: shop.id },
    });
    expect(batches).toHaveLength(1);

    const orders = await testPrisma.order.findMany({
      where: { batch_id: batches[0].id },
    });
    const expectedTotal = orders.reduce(
      (sum, o) => sum + Number(o.item_total),
      0
    );

    expect(Number(batches[0].collective_total)).toBeCloseTo(expectedTotal, 2);
  });
});
