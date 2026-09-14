import { describe, expect, it } from "vitest";

import { rejectOrderAction } from "../../../src/actions/shop/order-management-actions";
import {
  createBatchSlot,
  createShop,
  createUser,
  futureSlotTime,
  seedCartForShop,
} from "../../factories";
import { asUser } from "../../setup/auth";
import { testPrisma } from "../../setup/integration-setup";

describe("rejectOrderAction decrements Batch.collective_total", () => {
  it("decrements the batch total by the rejected order's item_total", async () => {
    const { at, cutoffMinutes } = futureSlotTime();
    const shop = await createShop({
      accepting_orders: true,
      batch_min_order_value: 1000,
    });
    const owner = await createUser({ shop_id: shop.id });
    await createBatchSlot({
      shop_id: shop.id,
      cutoff_time_minutes: cutoffMinutes,
      is_active: true,
    });

    const a = await seedCartForShop(shop);
    const { createContainer } = await import("../../../src/di/container");
    const { orderService } = createContainer({ prisma: testPrisma });
    const order = await orderService.createOrderFromCart(
      a.user.id,
      shop.id,
      "CASH",
      a.address.id,
      undefined,
      at
    );

    asUser(owner);
    await rejectOrderAction(order.id, "Out of stock");

    const batchAfter = await testPrisma.batch.findUnique({
      where: { id: order.batch_id! },
    });
    expect(Number(batchAfter!.collective_total)).toBe(0);
  });
});
