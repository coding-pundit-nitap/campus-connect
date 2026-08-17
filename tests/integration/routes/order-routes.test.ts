import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { GET as GET_ORDER } from "../../../src/app/api/orders/[order_id]/route";
import { GET as GET_ORDERS } from "../../../src/app/api/orders/route";
import { createContainer } from "../../../src/di/container";
import type { PaymentMethod, Prisma } from "../../../src/generated/client";
import {
  createOrderAtStatus,
  createShop,
  createUser,
  createUserAddress,
  seedCartReadyForCheckout,
} from "../../factories";
import { asAnonymous, asUser } from "../../setup/auth";
import { testPrisma } from "../../setup/integration-setup";

const { orderRepository, orderService } = createContainer({
  prisma: testPrisma,
});

type CreateOrderArgs = {
  user_id: string;
  shop_id: string;
  payment_method: PaymentMethod;
  delivery_address_id: string;
  is_direct_delivery?: boolean;
};

function createOrder(args: CreateOrderArgs) {
  return orderService.createOrderFromCart(
    args.user_id,
    args.shop_id,
    args.payment_method,
    args.delivery_address_id,
    undefined,
    undefined,
    undefined,
    undefined,
    args.is_direct_delivery
  );
}

describe("GET /api/orders", () => {
  it("returns 500 when signed out (UnauthenticatedError isn't a ZodError, so it falls to the generic 500 catch)", async () => {
    asAnonymous();
    const res = await GET_ORDERS(
      new NextRequest("http://localhost/api/orders")
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe(true);
  });

  it("returns 400 for an invalid query param (status not in the OrderStatus enum)", async () => {
    const user = await createUser();
    asUser(user);
    const res = await GET_ORDERS(
      new NextRequest("http://localhost/api/orders?status=NOT_A_STATUS")
    );
    expect(res.status).toBe(400);
  });

  it("returns 200 with an empty page when the caller has no orders", async () => {
    const user = await createUser();
    asUser(user);
    const res = await GET_ORDERS(
      new NextRequest("http://localhost/api/orders")
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.data).toEqual([]);
    expect(body.data.hasMore).toBe(false);
  });

  it("returns only the caller's own orders - a second buyer's order never appears in the page", async () => {
    const seeded = await seedCartReadyForCheckout();
    const address = await createUserAddress({
      user_id: seeded.user.id,
      building_id: "bld-test-1",
    });
    const order = await createOrder({
      user_id: seeded.user.id,
      shop_id: seeded.shop.id,
      payment_method: "CASH",
      delivery_address_id: address.id,
      is_direct_delivery: true,
    });

    const otherSeeded = await seedCartReadyForCheckout();
    const otherAddress = await createUserAddress({
      user_id: otherSeeded.user.id,
      building_id: "bld-test-1",
    });
    const otherOrder = await createOrder({
      user_id: otherSeeded.user.id,
      shop_id: otherSeeded.shop.id,
      payment_method: "CASH",
      delivery_address_id: otherAddress.id,
      is_direct_delivery: true,
    });

    asUser(seeded.user);
    const res = await GET_ORDERS(
      new NextRequest("http://localhost/api/orders")
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    const ids = body.data.data.map((o: { id: string }) => o.id);
    expect(ids).toEqual([order.id]);
    expect(ids).not.toContain(otherOrder.id);
    expect(
      body.data.data.every(
        (o: { user_id: string }) => o.user_id === seeded.user.id
      )
    ).toBe(true);
  });

  it("filters by status within the caller's own orders only", async () => {
    const owner = await createUser();
    const intruderShop = await createShop();
    const intruder = await createUser();

    const ownShop = await createShop();
    const ownNew = await createOrderAtStatus({
      shop_id: ownShop.id,
      order_status: "NEW",
      user_id: owner.id,
    });
    const ownCompleted = await createOrderAtStatus({
      shop_id: ownShop.id,
      order_status: "COMPLETED",
      user_id: owner.id,
    });
    // Another user's order at the SAME status the caller will filter on.
    const foreignNew = await createOrderAtStatus({
      shop_id: intruderShop.id,
      order_status: "NEW",
      user_id: intruder.id,
    });

    asUser(owner);
    const res = await GET_ORDERS(
      new NextRequest("http://localhost/api/orders?status=NEW")
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    const ids = body.data.data.map((o: { id: string }) => o.id);

    expect(ids).not.toContain(ownCompleted.id);
    expect(ids).not.toContain(foreignNew.id);
    expect(ids).toEqual([ownNew.id]);
  });

  it("a date filter narrows the caller's page without widening the scope", async () => {
    const owner = await createUser();
    const shop = await createShop();
    await createOrderAtStatus({
      shop_id: shop.id,
      order_status: "NEW",
      user_id: owner.id,
    });

    const stranger = await createUser();
    const strangerShop = await createShop();
    const strangerOrder = await createOrderAtStatus({
      shop_id: strangerShop.id,
      order_status: "NEW",
      user_id: stranger.id,
    });

    asUser(owner);
    const res = await GET_ORDERS(
      new NextRequest(
        "http://localhost/api/orders?date_from=1990-01-01&date_to=1990-12-31"
      )
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.data).toEqual([]);
    expect(body.data.data.map((o: { id: string }) => o.id)).not.toContain(
      strangerOrder.id
    );
  });
});
describe("OrderRepository scope hardening", () => {
  it("getOrdersByUserId: a caller-supplied `where` cannot widen beyond the user scope", async () => {
    const owner = await createUser();
    const shop = await createShop();
    const ownOrder = await createOrderAtStatus({
      shop_id: shop.id,
      order_status: "NEW",
      user_id: owner.id,
    });

    const stranger = await createUser();
    const strangerShop = await createShop();
    const strangerOrder = await createOrderAtStatus({
      shop_id: strangerShop.id,
      order_status: "NEW",
      user_id: stranger.id,
    });

    const wideOpen = await orderRepository.getOrdersByUserId(owner.id, {
      where: { order_status: undefined, created_at: undefined },
    });
    expect(wideOpen.map((o) => o.id)).toEqual([ownOrder.id]);

    const impersonation = await orderRepository.getOrdersByUserId(owner.id, {
      where: { user_id: stranger.id },
    });
    expect(impersonation.map((o) => o.id)).toEqual([ownOrder.id]);
    expect(impersonation.map((o) => o.id)).not.toContain(strangerOrder.id);

    const filtered = await orderRepository.getOrdersByUserId(owner.id, {
      where: { order_status: "COMPLETED" },
    });
    expect(filtered).toEqual([]);
  });

  it("getOrdersByShopId: a caller-supplied `where` cannot widen beyond the shop scope", async () => {
    const buyer = await createUser();
    const shopA = await createShop();
    const shopB = await createShop();

    const orderA = await createOrderAtStatus({
      shop_id: shopA.id,
      order_status: "NEW",
      user_id: buyer.id,
    });
    const orderB = await createOrderAtStatus({
      shop_id: shopB.id,
      order_status: "NEW",
      user_id: buyer.id,
    });

    const wideOpenArgs: Prisma.OrderFindManyArgs = {
      where: { order_status: undefined },
    };
    const wideOpen = await orderRepository.getOrdersByShopId(
      shopA.id,
      wideOpenArgs
    );
    expect(wideOpen.map((o) => o.id)).toEqual([orderA.id]);
    expect(wideOpen.map((o) => o.id)).not.toContain(orderB.id);

    const impersonationArgs: Prisma.OrderFindManyArgs = {
      where: { shop_id: shopB.id },
    };
    const impersonation = await orderRepository.getOrdersByShopId(
      shopA.id,
      impersonationArgs
    );
    expect(impersonation.map((o) => o.id)).toEqual([orderA.id]);
    expect(impersonation.map((o) => o.id)).not.toContain(orderB.id);

    const filterArgs: Prisma.OrderFindManyArgs = {
      where: { order_status: "NEW" },
    };
    const filtered = await orderRepository.getOrdersByShopId(
      shopA.id,
      filterArgs
    );
    expect(filtered.map((o) => o.id)).toEqual([orderA.id]);
  });

  it("getOrdersByIds: a caller-supplied `where` cannot widen beyond the id list", async () => {
    const buyer = await createUser();
    const shop = await createShop();
    const wanted = await createOrderAtStatus({
      shop_id: shop.id,
      order_status: "NEW",
      user_id: buyer.id,
    });
    const unwanted = await createOrderAtStatus({
      shop_id: shop.id,
      order_status: "NEW",
      user_id: buyer.id,
    });

    const args: Prisma.OrderFindManyArgs = {
      where: { order_status: undefined },
    };
    const rows = await orderRepository.getOrdersByIds([wanted.id], args);
    expect(rows.map((o) => o.id)).toEqual([wanted.id]);
    expect(rows.map((o) => o.id)).not.toContain(unwanted.id);
  });
});

describe("GET /api/orders/[order_id]", () => {
  function getOrder(order_id: string) {
    return GET_ORDER(
      new NextRequest(`http://localhost/api/orders/${order_id}`),
      { params: Promise.resolve({ order_id }) }
    );
  }

  it("returns 401 when signed out (this handler, unlike the others in this slice, maps UnauthenticatedError to 401)", async () => {
    asAnonymous();
    const res = await getOrder("does-not-matter");
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns 404 for an order id that does not exist", async () => {
    const user = await createUser();
    asUser(user);
    const res = await getOrder("missing-order-id");
    expect(res.status).toBe(404);
  });

  it("returns 403 when the order belongs to a different user", async () => {
    const owner = await createUser();
    const shop = await createShop();
    const order = await createOrderAtStatus({
      shop_id: shop.id,
      order_status: "NEW",
      user_id: owner.id,
    });

    const intruder = await createUser();
    asUser(intruder);

    const res = await getOrder(order.id);
    expect(res.status).toBe(403);
  });

  it("returns 200 with the order's full details for its owner", async () => {
    const seeded = await seedCartReadyForCheckout();
    const address = await createUserAddress({
      user_id: seeded.user.id,
      building_id: "bld-test-1",
    });
    const order = await createOrder({
      user_id: seeded.user.id,
      shop_id: seeded.shop.id,
      payment_method: "CASH",
      delivery_address_id: address.id,
      is_direct_delivery: true,
    });

    asUser(seeded.user);
    const res = await getOrder(order.id);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(order.id);
    expect(body.data.user_id).toBe(seeded.user.id);
    expect(body.data.items).toHaveLength(seeded.cart.items.length);
  });
});
