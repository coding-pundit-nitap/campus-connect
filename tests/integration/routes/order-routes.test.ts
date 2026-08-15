import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { GET as GET_ORDER } from "../../../src/app/api/orders/[order_id]/route";
import { GET as GET_ORDERS } from "../../../src/app/api/orders/route";
import { createContainer } from "../../../src/di/container";
import type { PaymentMethod } from "../../../src/generated/client";
import {
  createOrderAtStatus,
  createShop,
  createUser,
  createUserAddress,
  seedCartReadyForCheckout,
} from "../../factories";
import { asAnonymous, asUser } from "../../setup/auth";
import { testPrisma } from "../../setup/integration-setup";

const { orderService } = createContainer({ prisma: testPrisma });

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
    const res = await GET_ORDERS(new NextRequest("http://localhost/api/orders"));
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
    const res = await GET_ORDERS(new NextRequest("http://localhost/api/orders"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.data).toEqual([]);
    expect(body.data.hasMore).toBe(false);
  });

  it("returns 200 but leaks other users' orders into the page — the user_id scope is dropped when getOrdersByUserId's caller-supplied `where` replaces `{ user_id }` via object spread (order.repository.ts)", async () => {
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
    const res = await GET_ORDERS(new NextRequest("http://localhost/api/orders"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.data).toHaveLength(2);
    expect(body.data.data.map((o: { id: string }) => o.id).sort()).toEqual(
      [order.id, otherOrder.id].sort()
    );
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
