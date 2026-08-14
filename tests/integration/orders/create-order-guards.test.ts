import { beforeEach, describe, expect, it } from "vitest";

import { createContainer } from "../../../src/di/container";
import type { PaymentMethod } from "../../../src/generated/client";
import {
  createUser,
  createUserAddress,
  futureSlotTime,
  seedCartReadyForCheckout,
} from "../../factories";
import { testPrisma } from "../../setup/integration-setup";

const { orderService } = createContainer({ prisma: testPrisma });


type CreateOrderArgs = {
  user_id: string;
  shop_id: string;
  payment_method: PaymentMethod;
  delivery_address_id: string;
  pg_payment_id?: string;
  requested_delivery_time?: Date;
  upi_transaction_id?: string;
  customer_notes?: string;
  is_direct_delivery?: boolean;
  batch_id?: string;
};

function createOrder(args: CreateOrderArgs) {
  return orderService.createOrderFromCart(
    args.user_id,
    args.shop_id,
    args.payment_method,
    args.delivery_address_id,
    args.pg_payment_id,
    args.requested_delivery_time,
    args.upi_transaction_id,
    args.customer_notes,
    args.is_direct_delivery,
    args.batch_id
  );
}

async function expectGuardRejection(
  promise: Promise<unknown>,
  errorName: "ValidationError" | "NotFoundError" | "UnauthorizedError",
  messagePattern: RegExp
) {
  await expect(promise).rejects.toMatchObject({
    name: errorName,
    message: expect.stringMatching(messagePattern),
  });
}

async function assertNothingWritten() {
  await expect(testPrisma.order.count()).resolves.toBe(0);
  await expect(testPrisma.orderItem.count()).resolves.toBe(0);
  await expect(testPrisma.batch.count()).resolves.toBe(0);
}

describe("createOrderFromCart guards", () => {
  let seeded: Awaited<ReturnType<typeof seedCartReadyForCheckout>>;

  beforeEach(async () => {
    seeded = await seedCartReadyForCheckout();
  });

  describe("argument-shape guards (order.service.ts:217-231)", () => {
    it("rejects direct delivery combined with a batch id", async () => {
      const { user, shop, address } = seeded;
      await expectGuardRejection(
        createOrder({
          user_id: user.id,
          shop_id: shop.id,
          payment_method: "CASH",
          delivery_address_id: address.id,
          is_direct_delivery: true,
          batch_id: "some-batch-id",
        }),
        "ValidationError",
        /cannot be scheduled or assigned to a batch/i
      );
      await assertNothingWritten();
    });

    it("rejects direct delivery combined with a requested delivery time", async () => {
      const { user, shop, address } = seeded;
      const { at } = futureSlotTime();
      await expectGuardRejection(
        createOrder({
          user_id: user.id,
          shop_id: shop.id,
          payment_method: "CASH",
          delivery_address_id: address.id,
          is_direct_delivery: true,
          requested_delivery_time: at,
        }),
        "ValidationError",
        /cannot be scheduled or assigned to a batch/i
      );
      await assertNothingWritten();
    });

    it("rejects batch delivery with neither a batch id nor a requested delivery time", async () => {
      const { user, shop, address } = seeded;
      await expectGuardRejection(
        createOrder({
          user_id: user.id,
          shop_id: shop.id,
          payment_method: "CASH",
          delivery_address_id: address.id,
          is_direct_delivery: false,
        }),
        "ValidationError",
        /must specify a batch id or requested delivery time/i
      );
      await assertNothingWritten();
    });

    it("rejects both a batch id and a requested delivery time supplied together", async () => {
      const { user, shop, address } = seeded;
      const { at } = futureSlotTime();
      await expectGuardRejection(
        createOrder({
          user_id: user.id,
          shop_id: shop.id,
          payment_method: "CASH",
          delivery_address_id: address.id,
          is_direct_delivery: false,
          batch_id: "some-batch-id",
          requested_delivery_time: at,
        }),
        "ValidationError",
        /provide either batch id or requested delivery time, not both/i
      );
      await assertNothingWritten();
    });
  });

  describe("entity guards (order.service.ts:261-280)", () => {
    it("rejects when the cart has no row for (user, shop)", async () => {
      const { shop } = seeded;
      const otherUser = await createUser();
      const address = await createUserAddress({
        user_id: otherUser.id,
        building_id: "bld-test-1",
      });

      await expectGuardRejection(
        createOrder({
          user_id: otherUser.id,
          shop_id: shop.id,
          payment_method: "CASH",
          delivery_address_id: address.id,
          is_direct_delivery: true,
        }),
        "NotFoundError",
        /cart is empty/i
      );
      await assertNothingWritten();
    });

    it("rejects when the cart exists but has no items", async () => {
      const { shop } = seeded;
      const otherUser = await createUser();
      const address = await createUserAddress({
        user_id: otherUser.id,
        building_id: "bld-test-1",
      });
      await testPrisma.cart.create({
        data: { user_id: otherUser.id, shop_id: shop.id },
      });

      await expectGuardRejection(
        createOrder({
          user_id: otherUser.id,
          shop_id: shop.id,
          payment_method: "CASH",
          delivery_address_id: address.id,
          is_direct_delivery: true,
        }),
        "NotFoundError",
        /cart is empty/i
      );
      await assertNothingWritten();
    });

    it("rejects a nonexistent shop id via the cart-empty guard, not a shop guard", async () => {
      const { user, address } = seeded;
      await expectGuardRejection(
        createOrder({
          user_id: user.id,
          shop_id: "missing-shop-id",
          payment_method: "CASH",
          delivery_address_id: address.id,
          is_direct_delivery: true,
        }),
        "NotFoundError",
        /cart is empty/i
      );
      await assertNothingWritten();
    });

    it("rejects when the shop is soft-deleted", async () => {
      const { user, shop, address } = seeded;
      await testPrisma.shop.update({
        where: { id: shop.id },
        data: { deleted_at: new Date() },
      });

      await expectGuardRejection(
        createOrder({
          user_id: user.id,
          shop_id: shop.id,
          payment_method: "CASH",
          delivery_address_id: address.id,
          is_direct_delivery: true,
        }),
        "NotFoundError",
        /shop not found/i
      );
      await assertNothingWritten();
    });

    it("rejects when the shop is not active", async () => {
      const { user, shop, address } = seeded;
      await testPrisma.shop.update({
        where: { id: shop.id },
        data: { is_active: false },
      });

      await expectGuardRejection(
        createOrder({
          user_id: user.id,
          shop_id: shop.id,
          payment_method: "CASH",
          delivery_address_id: address.id,
          is_direct_delivery: true,
        }),
        "ValidationError",
        /not accepting orders/i
      );
      await assertNothingWritten();
    });

    it("rejects when the shop is not accepting orders", async () => {
      const { user, shop, address } = seeded;
      await testPrisma.shop.update({
        where: { id: shop.id },
        data: { accepting_orders: false },
      });

      await expectGuardRejection(
        createOrder({
          user_id: user.id,
          shop_id: shop.id,
          payment_method: "CASH",
          delivery_address_id: address.id,
          is_direct_delivery: true,
        }),
        "ValidationError",
        /not accepting orders at the moment/i
      );
      await assertNothingWritten();
    });

    it("rejects when the delivery address does not exist", async () => {
      const { user, shop } = seeded;
      await expectGuardRejection(
        createOrder({
          user_id: user.id,
          shop_id: shop.id,
          payment_method: "CASH",
          delivery_address_id: "missing-address-id",
          is_direct_delivery: true,
        }),
        "NotFoundError",
        /delivery address not found/i
      );
      await assertNothingWritten();
    });

    it("rejects when the delivery address belongs to a different user", async () => {
      const { user, shop } = seeded;
      const otherUser = await createUser();
      const otherAddress = await createUserAddress({
        user_id: otherUser.id,
        building_id: "bld-test-1",
      });

      await expectGuardRejection(
        createOrder({
          user_id: user.id,
          shop_id: shop.id,
          payment_method: "CASH",
          delivery_address_id: otherAddress.id,
          is_direct_delivery: true,
        }),
        "UnauthorizedError",
        /does not belong to user/i
      );
      await assertNothingWritten();
    });

    it("rejects an address outside the shop's configured delivery buildings", async () => {
      const { user, shop } = seeded;
      await testPrisma.shopDeliveryBuilding.create({
        data: { shop_id: shop.id, building_id: "bld-test-1", is_active: true },
      });
      const otherBuilding = await testPrisma.building.create({
        data: { id: "bld-test-2", name: "Other Hostel" },
      });
      const outsideAddress = await createUserAddress({
        user_id: user.id,
        building_id: otherBuilding.id,
      });

      await expectGuardRejection(
        createOrder({
          user_id: user.id,
          shop_id: shop.id,
          payment_method: "CASH",
          delivery_address_id: outsideAddress.id,
          is_direct_delivery: true,
        }),
        "ValidationError",
        /does not deliver to the selected building/i
      );
      await assertNothingWritten();
    });
  });
});
