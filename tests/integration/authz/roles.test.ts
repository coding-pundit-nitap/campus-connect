import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { makeUserAdminAction } from "../../../src/actions/admin/user-actions";
import {
  cancelOrderAction,
  getOrderByIdAction,
  getOrdersAction,
} from "../../../src/actions/orders/order-actions";
import { updateProductAction } from "../../../src/actions/product/product-actions";
import { acceptOrderAction } from "../../../src/actions/shop/order-management-actions";
import { GET as GET_ALL_CARTS } from "../../../src/app/api/cart/all/route";
import { GET as GET_CART } from "../../../src/app/api/cart/route";
import { GET as GET_ORDER } from "../../../src/app/api/orders/[order_id]/route";
import { GET as GET_ORDERS } from "../../../src/app/api/orders/route";
import { GET as GET_SELLER_ORDERS } from "../../../src/app/api/seller/orders/route";
import authUtils from "../../../src/lib/utils/auth.utils.server";
import { Role } from "../../../src/types/prisma.types";
import {
  createOrderAtStatus,
  createShop,
  createUser,
  seedShopWithProducts,
} from "../../factories";
import { asAnonymous, asUser } from "../../setup/auth";
import { testPrisma } from "../../setup/integration-setup";

describe("roles: admin-only routes denied to a non-admin", () => {
  it("makeUserAdminAction (mutation) rejects a non-admin caller with ForbiddenError, and does not promote the target", async () => {
    const nonAdmin = await createUser({ role: Role.USER });
    const target = await createUser({ role: Role.USER });

    asUser(nonAdmin);

    await expect(makeUserAdminAction(target.id)).rejects.toMatchObject({
      name: "ForbiddenError",
    });

    const after = await testPrisma.user.findUniqueOrThrow({
      where: { id: target.id },
    });
    expect(after.role).toBe(Role.USER);
  });

  it("makeUserAdminAction rejects a signed-out caller and never promotes the target", async () => {
    const target = await createUser({ role: Role.USER });
    asAnonymous();

    await expect(makeUserAdminAction(target.id)).rejects.toBeTruthy();

    const after = await testPrisma.user.findUniqueOrThrow({
      where: { id: target.id },
    });
    expect(after.role).toBe(Role.USER);
  });
});

describe("roles: getOwnedShopId() rejects a seller with no shop_id", () => {
  it("GET /api/seller/orders denies a plain user (no shop_id) - no order data in the response", async () => {
    const plainUser = await createUser();
    asUser(plainUser);

    const res = await GET_SELLER_ORDERS();
    expect(res.status).not.toBe(200);
    const body = await res.text();
    expect(body).not.toMatch(/"order/i);
  });

  it("acceptOrderAction denies a plain user (no shop_id) with BadRequestError, and leaves the order untouched", async () => {
    const { shop } = await seedShopWithProducts();
    const order = await createOrderAtStatus({
      shop_id: shop.id,
      order_status: "NEW",
    });

    const plainUser = await createUser();
    asUser(plainUser);

    await expect(acceptOrderAction(order.id)).rejects.toMatchObject({
      name: "BadRequestError",
    });

    const after = await testPrisma.order.findUniqueOrThrow({
      where: { id: order.id },
    });
    expect(after.order_status).toBe("NEW");
  });
});

describe("roles: a signed-out caller is denied on every protected route in this slice", () => {
  it("rejects every route/action below", async () => {
    const shop = await createShop();
    const owner = await createUser({ shop_id: shop.id });
    const victim = await createUser();
    const order = await createOrderAtStatus({
      shop_id: shop.id,
      order_status: "NEW",
      user_id: victim.id,
    });

    asAnonymous();

    const routeChecks: Array<[string, () => Promise<Response>]> = [
      [
        "GET /api/orders",
        () => GET_ORDERS(new NextRequest("http://localhost/api/orders")),
      ],
      [
        "GET /api/orders/[order_id]",
        () =>
          GET_ORDER(
            new NextRequest(`http://localhost/api/orders/${order.id}`),
            {
              params: Promise.resolve({ order_id: order.id }),
            }
          ),
      ],
      ["GET /api/seller/orders", () => GET_SELLER_ORDERS()],
      [
        "GET /api/cart",
        () =>
          GET_CART(
            new NextRequest(`http://localhost/api/cart?shop_id=${shop.id}`)
          ),
      ],
      ["GET /api/cart/all", () => GET_ALL_CARTS()],
    ];

    for (const [name, run] of routeChecks) {
      const res = await run();
      expect(
        res.status,
        `${name} must not return 200 when signed out`
      ).not.toBe(200);
      const body = await res.text();
      expect(
        body,
        `${name} must not leak the victim order's display_id when signed out`
      ).not.toContain(order.display_id);
    }

    const actionChecks: Array<[string, () => Promise<unknown>]> = [
      ["getOrdersAction", () => getOrdersAction({})],
      ["getOrderByIdAction", () => getOrderByIdAction(order.id)],
      ["cancelOrderAction", () => cancelOrderAction(order.id)],
      ["acceptOrderAction", () => acceptOrderAction(order.id)],
      [
        "updateProductAction",
        () =>
          updateProductAction("does-not-matter", {
            name: "x",
            price: 1,
            stock_quantity: 1,
            discount: 0,
          }),
      ],
      ["makeUserAdminAction", () => makeUserAdminAction(victim.id)],
      ["authUtils.getOwnedShopId", () => authUtils.getOwnedShopId()],
    ];

    for (const [name, run] of actionChecks) {
      await expect(
        run(),
        `${name} must reject when signed out`
      ).rejects.toBeTruthy();
    }

    void owner;
  });
});
