import { describe, expect, it } from "vitest";

import {
  batchUpdateOrderStatusAction,
  cancelOrderAction,
  getOrderByIdAction,
  getOrdersAction,
  getShopOrderByIdAction,
} from "../../../src/actions/orders/order-actions";
import {
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
  ValidationError,
} from "../../../src/lib/custom-error";
import {
  createOrderAtStatus,
  createUser,
  seedShopWithProducts,
} from "../../factories";
import { asAnonymous, asUser } from "../../setup/auth";

describe("getOrdersAction — error types", () => {
  it("rejects an anonymous caller with UnauthenticatedError, not a generic 500", async () => {
    asAnonymous();
    await expect(getOrdersAction({})).rejects.toBeInstanceOf(
      UnauthenticatedError
    );
  });
});

describe("getOrderByIdAction — error types", () => {
  it("rejects an anonymous caller with UnauthenticatedError", async () => {
    const { shop } = await seedShopWithProducts();
    const buyer = await createUser();
    const order = await createOrderAtStatus({
      shop_id: shop.id,
      order_status: "NEW",
      user_id: buyer.id,
    });

    asAnonymous();

    await expect(getOrderByIdAction(order.id)).rejects.toBeInstanceOf(
      UnauthenticatedError
    );
  });

  // Fix F, items 5 & 6: a missing order and an order that exists but
  // belongs to someone else are now indistinguishable (both NotFoundError,
  // both a 404) — a caller cannot use the response to probe whether an
  // order id exists at all. Previously the "doesn't belong to you" branch
  // threw UnauthorizedError while a truly missing order threw a bare
  // Error (flattened to a 500 by the catch) — two different outcomes an
  // attacker could distinguish.
  it("rejects a caller who doesn't own the order with NotFoundError, not UnauthorizedError", async () => {
    const { shop } = await seedShopWithProducts();
    const buyer = await createUser();
    const order = await createOrderAtStatus({
      shop_id: shop.id,
      order_status: "NEW",
      user_id: buyer.id,
    });

    const stranger = await createUser();
    asUser(stranger);

    await expect(getOrderByIdAction(order.id)).rejects.toMatchObject({
      name: "NotFoundError",
      message: "Order not found.",
    });
  });

  it("rejects a nonexistent order id with the identical NotFoundError — no existence oracle", async () => {
    const buyer = await createUser();
    asUser(buyer);

    await expect(
      getOrderByIdAction("does-not-exist")
    ).rejects.toMatchObject({
      name: "NotFoundError",
      message: "Order not found.",
    });
  });
});

describe("cancelOrderAction — error types", () => {
  // Fix F, item 5: previously a missing order threw ValidationError("Order
  // not found.") while another user's order threw UnauthorizedError — two
  // distinguishable outcomes an attacker could use to probe whether an
  // order id exists. Both branches now collapse into the single
  // UnauthorizedError check updateOrderStatusAction already used.
  it("rejects a caller who doesn't own the order with UnauthorizedError", async () => {
    const { shop } = await seedShopWithProducts();
    const buyer = await createUser();
    const order = await createOrderAtStatus({
      shop_id: shop.id,
      order_status: "NEW",
      user_id: buyer.id,
    });

    const stranger = await createUser();
    asUser(stranger);

    await expect(cancelOrderAction(order.id)).rejects.toMatchObject({
      name: "UnauthorizedError",
      message: "Unauthorized: This order doesn't belong to you.",
    });
  });

  it("rejects a nonexistent order id with the identical UnauthorizedError — no existence oracle", async () => {
    const buyer = await createUser();
    asUser(buyer);

    await expect(cancelOrderAction("does-not-exist")).rejects.toMatchObject({
      name: "UnauthorizedError",
      message: "Unauthorized: This order doesn't belong to you.",
    });
  });

  it("rejects cancelling a non-NEW order with ValidationError, not a generic 500", async () => {
    const { shop } = await seedShopWithProducts();
    const buyer = await createUser();
    const order = await createOrderAtStatus({
      shop_id: shop.id,
      order_status: "OUT_FOR_DELIVERY",
      user_id: buyer.id,
    });

    asUser(buyer);

    const rejection = cancelOrderAction(order.id);
    await expect(rejection).rejects.toBeInstanceOf(ValidationError);
    await expect(rejection).rejects.toMatchObject({
      message: "Only orders with status NEW can be cancelled.",
    });
  });
});

describe("getShopOrderByIdAction — error types", () => {
  it("rejects an anonymous caller with UnauthenticatedError", async () => {
    const { shop } = await seedShopWithProducts();
    const order = await createOrderAtStatus({
      shop_id: shop.id,
      order_status: "NEW",
    });

    asAnonymous();

    await expect(getShopOrderByIdAction(order.id)).rejects.toBeInstanceOf(
      UnauthenticatedError
    );
  });

  // Fix F, items 5 & 6: same indistinguishable-response treatment as
  // getOrderByIdAction above.
  it("rejects a different shop's owner with NotFoundError, not UnauthorizedError", async () => {
    const seededA = await seedShopWithProducts();
    const seededB = await seedShopWithProducts();
    const order = await createOrderAtStatus({
      shop_id: seededA.shop.id,
      order_status: "NEW",
    });

    asUser(seededB.owner);

    await expect(getShopOrderByIdAction(order.id)).rejects.toMatchObject({
      name: "NotFoundError",
      message: "Order not found.",
    });
  });

  it("rejects a nonexistent order id with the identical NotFoundError — no existence oracle", async () => {
    const seeded = await seedShopWithProducts();
    asUser(seeded.owner);

    await expect(
      getShopOrderByIdAction("does-not-exist")
    ).rejects.toMatchObject({
      name: "NotFoundError",
      message: "Order not found.",
    });
  });
});

describe("batchUpdateOrderStatusAction — error types", () => {
  it("rejects a batch containing a foreign order with UnauthorizedError, and does not leak the foreign order's display_id", async () => {
    const seededA = await seedShopWithProducts();
    const seededB = await seedShopWithProducts();

    const ownOrder = await createOrderAtStatus({
      shop_id: seededA.shop.id,
      order_status: "NEW",
    });
    const foreignOrder = await createOrderAtStatus({
      shop_id: seededB.shop.id,
      order_status: "NEW",
    });

    asUser(seededA.owner);

    const rejection = batchUpdateOrderStatusAction({
      orderIds: [ownOrder.id, foreignOrder.id],
      status: "BATCHED",
    });

    await expect(rejection).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(rejection).rejects.toMatchObject({
      message: "Unauthorized: One or more orders do not belong to your shop.",
    });
    await rejection.catch((error: unknown) => {
      expect(String((error as Error).message)).not.toContain(
        foreignOrder.display_id
      );
    });
  });

  it("still includes the display_id in ValidationError for an invalid transition, since that order belongs to the caller's own shop", async () => {
    const { shop, owner } = await seedShopWithProducts();
    const order = await createOrderAtStatus({
      shop_id: shop.id,
      order_status: "COMPLETED",
    });

    asUser(owner);

    await expect(
      batchUpdateOrderStatusAction({
        orderIds: [order.id],
        status: "NEW",
      })
    ).rejects.toMatchObject({
      name: "ValidationError",
      message: expect.stringContaining(order.display_id),
    });
  });
});
