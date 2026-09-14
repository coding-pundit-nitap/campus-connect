import { describe, expect, it } from "vitest";

import { updateOrderStatusAction } from "../../../src/actions/orders/order-actions";
import { createBatchSlot, createShop, createUser, futureSlotTime, seedCartForShop } from "../../factories";
import { asUser } from "../../setup/auth";
import { testPrisma } from "../../setup/integration-setup";

describe("updateOrderStatusAction decrements Batch.collective_total on CANCELLED", () => {
  it("decrements the batch total when an owner manually cancels a batched order", async () => {
    const { at, cutoffMinutes } = futureSlotTime();
    const shop = await createShop({ accepting_orders: true, batch_min_order_value: 1000 });
    const owner = await createUser({ shop_id: shop.id });
    await createBatchSlot({ shop_id: shop.id, cutoff_time_minutes: cutoffMinutes, is_active: true });

    const a = await seedCartForShop(shop);
    const { createContainer } = await import("../../../src/di/container");
    const { orderService } = createContainer({ prisma: testPrisma });
    const order = await orderService.createOrderFromCart(a.user.id, shop.id, "CASH", a.address.id, undefined, at);

    asUser(owner);
    await updateOrderStatusAction({ order_id: order.id, status: "CANCELLED" });

    const batchAfter = await testPrisma.batch.findUnique({ where: { id: order.batch_id! } });
    expect(Number(batchAfter!.collective_total)).toBe(0);
  });

  it("does not decrement twice if the order is already CANCELLED", async () => {
    const { at, cutoffMinutes } = futureSlotTime();
    const shop = await createShop({ accepting_orders: true, batch_min_order_value: 1000 });
    const owner = await createUser({ shop_id: shop.id });
    await createBatchSlot({ shop_id: shop.id, cutoff_time_minutes: cutoffMinutes, is_active: true });

    const a = await seedCartForShop(shop);
    const { createContainer } = await import("../../../src/di/container");
    const { orderService } = createContainer({ prisma: testPrisma });
    const order = await orderService.createOrderFromCart(a.user.id, shop.id, "CASH", a.address.id, undefined, at);

    asUser(owner);
    await updateOrderStatusAction({ order_id: order.id, status: "CANCELLED" });
    await expect(
      updateOrderStatusAction({ order_id: order.id, status: "CANCELLED" })
    ).rejects.toThrow();

    const batchAfter = await testPrisma.batch.findUnique({ where: { id: order.batch_id! } });
    expect(Number(batchAfter!.collective_total)).toBe(0);
  });
});
