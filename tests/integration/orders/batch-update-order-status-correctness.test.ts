import { afterEach, describe, expect, it, vi } from "vitest";

import { batchUpdateOrderStatusAction } from "../../../src/actions/orders/order-actions";
import { notificationService } from "../../../src/di/container";
import {
  createOrderAtStatus,
  createUser,
  seedShopWithProducts,
} from "../../factories";
import { asUser } from "../../setup/auth";

describe("batchUpdateOrderStatusAction correctness", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("only notifies orders that actually changed status, and reports the number of rows actually updated - not orderIds.length", async () => {
    const { shop, owner } = await seedShopWithProducts();

    const buyerToMove1 = await createUser();
    const buyerToMove2 = await createUser();
    const buyerAlreadyThere = await createUser();

    const orderToMove1 = await createOrderAtStatus({
      shop_id: shop.id,
      order_status: "NEW",
      user_id: buyerToMove1.id,
    });
    const orderToMove2 = await createOrderAtStatus({
      shop_id: shop.id,
      order_status: "NEW",
      user_id: buyerToMove2.id,
    });
    const orderAlreadyAtTarget = await createOrderAtStatus({
      shop_id: shop.id,
      order_status: "BATCHED",
      user_id: buyerAlreadyThere.id,
    });

    const publishSpy = vi
      .spyOn(notificationService, "publishNotification")
      .mockResolvedValue(undefined as never);

    asUser(owner);

    const result = await batchUpdateOrderStatusAction({
      orderIds: [orderToMove1.id, orderToMove2.id, orderAlreadyAtTarget.id],
      status: "BATCHED",
    });

    expect(result.details).toContain("2 orders");
    expect(result.details).not.toContain("3 orders");

    expect(publishSpy).toHaveBeenCalledTimes(2);
    const notifiedUserIds = publishSpy.mock.calls.map((call) => call[0]);
    expect(notifiedUserIds.sort()).toEqual(
      [buyerToMove1.id, buyerToMove2.id].sort()
    );
    expect(notifiedUserIds).not.toContain(buyerAlreadyThere.id);
  });

  it("awaits notification delivery before returning - the response does not resolve until publishNotification has settled", async () => {
    const { shop, owner } = await seedShopWithProducts();
    const buyer = await createUser();
    const order = await createOrderAtStatus({
      shop_id: shop.id,
      order_status: "NEW",
      user_id: buyer.id,
    });

    let notificationSettled = false;
    vi.spyOn(notificationService, "publishNotification").mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            notificationSettled = true;
            resolve(undefined as never);
          }, 20);
        })
    );

    asUser(owner);

    await batchUpdateOrderStatusAction({
      orderIds: [order.id],
      status: "BATCHED",
    });

    expect(notificationSettled).toBe(true);
  });
});
