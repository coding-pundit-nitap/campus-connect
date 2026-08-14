import { beforeEach, describe, expect, it } from "vitest";

import { createContainer } from "../../../src/di/container";
import type { PaymentMethod } from "../../../src/generated/client";
import {
  createBatchSlot,
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

describe("createOrderFromCart transaction rollback", () => {
  let seeded: Awaited<ReturnType<typeof seedCartReadyForCheckout>>;

  beforeEach(async () => {
    seeded = await seedCartReadyForCheckout();
  });

  it("writes nothing when order creation fails after the batch was already created", async () => {
    const { user, shop, address } = seeded;
    const slot = futureSlotTime();
    await createBatchSlot({
      shop_id: shop.id,
      cutoff_time_minutes: slot.cutoffMinutes,
      is_active: true,
    });

    const dupPgPaymentId = "pg-payment-collision-1";
    await testPrisma.order.create({
      data: {
        display_id: "SEED-DUMMY-COLLISION",
        item_total: 100,
        total_price: 100,
        payment_method: "ONLINE",
        payment_status: "COMPLETED",
        pg_payment_id: dupPgPaymentId,
        delivery_address_snapshot: {},
      },
    });

    await expect(
      createOrder({
        user_id: user.id,
        shop_id: shop.id,
        payment_method: "ONLINE",
        delivery_address_id: address.id,
        pg_payment_id: dupPgPaymentId,
        requested_delivery_time: slot.at,
      })
    ).rejects.toThrow();

    await expect(
      testPrisma.order.count({ where: { shop_id: shop.id } })
    ).resolves.toBe(0);
    await expect(testPrisma.orderItem.count()).resolves.toBe(0);
    await expect(
      testPrisma.batch.count({ where: { shop_id: shop.id } })
    ).resolves.toBe(0);
  });

  it("writes nothing when the delivery-building guard rejects the address", async () => {
    const { user, shop } = seeded;
    const slot = futureSlotTime();
    await createBatchSlot({
      shop_id: shop.id,
      cutoff_time_minutes: slot.cutoffMinutes,
      is_active: true,
    });

    await testPrisma.shopDeliveryBuilding.create({
      data: { shop_id: shop.id, building_id: "bld-test-1", is_active: true },
    });
    const otherBuilding = await testPrisma.building.create({
      data: { id: "bld-test-2", name: "Other Hostel" },
    });
    const outsideAddress = await testPrisma.userAddress.create({
      data: {
        user_id: user.id,
        label: "Outside delivery zone",
        building: otherBuilding.name,
        building_id: otherBuilding.id,
        room_number: "999",
      },
    });

    await expect(
      createOrder({
        user_id: user.id,
        shop_id: shop.id,
        payment_method: "CASH",
        delivery_address_id: outsideAddress.id,
        requested_delivery_time: slot.at,
      })
    ).rejects.toThrow(/does not deliver to the selected building/i);

    await expect(testPrisma.order.count()).resolves.toBe(0);
    await expect(testPrisma.orderItem.count()).resolves.toBe(0);
    await expect(testPrisma.batch.count()).resolves.toBe(0);
  });
});
