import { describe, expect, it } from "vitest";

import { batchUpdateOrderStatusAction } from "../../../src/actions/orders/order-actions";
import {
  createBatchSlot,
  createShop,
  createUser,
  futureSlotTime,
  seedCartForShop,
} from "../../factories";
import { asUser } from "../../setup/auth";
import { testPrisma } from "../../setup/integration-setup";

describe("batchUpdateOrderStatusAction decrements Batch.collective_total on CANCELLED", () => {
  it("decrements the batch total to zero when all orders in the batch are bulk-cancelled", async () => {
    const { at, cutoffMinutes } = futureSlotTime();
    const shop = await createShop({ accepting_orders: true, batch_min_order_value: 1000 });
    const owner = await createUser({ shop_id: shop.id });
    await createBatchSlot({ shop_id: shop.id, cutoff_time_minutes: cutoffMinutes, is_active: true });

    const a = await seedCartForShop(shop);
    const b = await seedCartForShop(shop);
    const { createContainer } = await import("../../../src/di/container");
    const { orderService } = createContainer({ prisma: testPrisma });

    const orderA = await orderService.createOrderFromCart(a.user.id, shop.id, "CASH", a.address.id, undefined, at);
    const orderB = await orderService.createOrderFromCart(b.user.id, shop.id, "CASH", b.address.id, undefined, at);

    expect(orderA.batch_id).toBe(orderB.batch_id);

    const expectedTotal = Number(orderA.item_total) + Number(orderB.item_total);
    const batchBefore = await testPrisma.batch.findUnique({ where: { id: orderA.batch_id! } });
    expect(Number(batchBefore!.collective_total)).toBeCloseTo(expectedTotal, 2);

    asUser(owner);
    const result = await batchUpdateOrderStatusAction({
      orderIds: [orderA.id, orderB.id],
      status: "CANCELLED",
    });

    expect(result.details).toContain("2 orders");

    const batchAfter = await testPrisma.batch.findUnique({ where: { id: orderA.batch_id! } });
    expect(Number(batchAfter!.collective_total)).toBe(0);

    const ordersAfter = await testPrisma.order.findMany({
      where: { id: { in: [orderA.id, orderB.id] } },
    });
    expect(ordersAfter.every((o) => o.order_status === "CANCELLED")).toBe(true);
  });

  it("decrements the batch total by only the cancelled orders' item_total when some orders are left un-cancelled", async () => {
    const { at, cutoffMinutes } = futureSlotTime();
    const shop = await createShop({ accepting_orders: true, batch_min_order_value: 1000 });
    const owner = await createUser({ shop_id: shop.id });
    await createBatchSlot({ shop_id: shop.id, cutoff_time_minutes: cutoffMinutes, is_active: true });

    const a = await seedCartForShop(shop);
    const b = await seedCartForShop(shop);
    const { createContainer } = await import("../../../src/di/container");
    const { orderService } = createContainer({ prisma: testPrisma });

    const orderToCancel = await orderService.createOrderFromCart(
      a.user.id,
      shop.id,
      "CASH",
      a.address.id,
      undefined,
      at
    );
    const orderToKeep = await orderService.createOrderFromCart(
      b.user.id,
      shop.id,
      "CASH",
      b.address.id,
      undefined,
      at
    );

    expect(orderToCancel.batch_id).toBe(orderToKeep.batch_id);

    asUser(owner);
    await batchUpdateOrderStatusAction({
      orderIds: [orderToCancel.id],
      status: "CANCELLED",
    });

    const batchAfter = await testPrisma.batch.findUnique({ where: { id: orderToKeep.batch_id! } });
    expect(Number(batchAfter!.collective_total)).toBeCloseTo(Number(orderToKeep.item_total), 2);

    const keptOrderAfter = await testPrisma.order.findUnique({ where: { id: orderToKeep.id } });
    expect(keptOrderAfter!.order_status).not.toBe("CANCELLED");
  });
});
