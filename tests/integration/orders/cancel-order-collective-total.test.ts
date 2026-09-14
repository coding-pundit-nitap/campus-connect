import { describe, expect, it } from "vitest";

import { cancelOrderAction } from "../../../src/actions/orders/order-actions";
import {
  createBatchSlot,
  createShop,
  futureSlotTime,
  seedCartForShop,
} from "../../factories";
import { asUser } from "../../setup/auth";
import { testPrisma } from "../../setup/integration-setup";

describe("cancelOrderAction decrements Batch.collective_total", () => {
  it("decrements the batch total by the cancelled order's item_total", async () => {
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

    const batchBefore = await testPrisma.batch.findUnique({
      where: { id: order.batch_id! },
    });
    expect(Number(batchBefore!.collective_total)).toBeCloseTo(
      Number(order.item_total),
      2
    );

    asUser(a.user);
    await cancelOrderAction(order.id);

    const batchAfter = await testPrisma.batch.findUnique({
      where: { id: order.batch_id! },
    });
    expect(Number(batchAfter!.collective_total)).toBe(0);
  });
});
