import { beforeEach, describe, expect, it } from "vitest";

import { createContainer } from "../../../src/di/container";
import type { PaymentMethod } from "../../../src/generated/client";
import {
  createBatchSlot,
  createUserAddress,
  futureSlotTime,
  seedCartForShop,
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

async function expectValidationRejection(
  promise: Promise<unknown>,
  messagePattern: RegExp
) {
  await expect(promise).rejects.toMatchObject({
    name: "ValidationError",
    message: expect.stringMatching(messagePattern),
  });
}

async function assertNothingWritten() {
  await expect(testPrisma.order.count()).resolves.toBe(0);
  await expect(testPrisma.batch.count()).resolves.toBe(0);
}

describe("findOrCreateBatchForRequestedTime (via createOrderFromCart)", () => {
  let seeded: Awaited<ReturnType<typeof seedCartReadyForCheckout>>;

  beforeEach(async () => {
    seeded = await seedCartReadyForCheckout();
  });

  it("creates an OPEN batch at the requested cutoff when an active slot matches", async () => {
    const { user, shop, address } = seeded;
    const { at, cutoffMinutes } = futureSlotTime();
    await createBatchSlot({
      shop_id: shop.id,
      cutoff_time_minutes: cutoffMinutes,
    });

    const order = await createOrder({
      user_id: user.id,
      shop_id: shop.id,
      payment_method: "CASH",
      delivery_address_id: address.id,
      requested_delivery_time: at,
    });

    expect(order.batch_id).not.toBeNull();
    expect(order.is_direct_delivery).toBe(false);

    const batch = await testPrisma.batch.findUniqueOrThrow({
      where: { id: order.batch_id! },
    });
    expect(batch.shop_id).toBe(shop.id);
    expect(batch.status).toBe("OPEN");
    expect(batch.cutoff_time.getTime()).toBe(at.getTime());
    await expect(
      testPrisma.batch.count({ where: { shop_id: shop.id } })
    ).resolves.toBe(1);
  });

  it("reuses an existing OPEN batch for a second order at the same cutoff — one Batch row, both orders attached", async () => {
    const { user, shop, address } = seeded;
    const { at, cutoffMinutes } = futureSlotTime();
    await createBatchSlot({
      shop_id: shop.id,
      cutoff_time_minutes: cutoffMinutes,
    });

    const firstOrder = await createOrder({
      user_id: user.id,
      shop_id: shop.id,
      payment_method: "CASH",
      delivery_address_id: address.id,
      requested_delivery_time: at,
    });

    const second = await seedCartForShop(shop);
    const secondAddress = await createUserAddress({
      user_id: second.user.id,
      building_id: "bld-test-1",
    });
    const secondOrder = await createOrder({
      user_id: second.user.id,
      shop_id: shop.id,
      payment_method: "CASH",
      delivery_address_id: secondAddress.id,
      requested_delivery_time: at,
    });

    expect(secondOrder.batch_id).toBe(firstOrder.batch_id);
    await expect(
      testPrisma.batch.count({ where: { shop_id: shop.id } })
    ).resolves.toBe(1);

    const attachedOrders = await testPrisma.order.findMany({
      where: { batch_id: firstOrder.batch_id! },
      select: { id: true },
    });
    expect(attachedOrders.map((o) => o.id).sort()).toEqual(
      [firstOrder.id, secondOrder.id].sort()
    );
  });

  it("rejects a cutoff at or before now without rolling forward", async () => {
    const { user, shop, address } = seeded;
    const pastTime = new Date(Date.now() - 5 * 60_000);

    await expectValidationRejection(
      createOrder({
        user_id: user.id,
        shop_id: shop.id,
        payment_method: "CASH",
        delivery_address_id: address.id,
        requested_delivery_time: pastTime,
      }),
      /in the past/i
    );
    await assertNothingWritten();
  });

  it("rejects when the shop has no active BatchSlot configured", async () => {
    const { user, shop, address } = seeded;
    const { at } = futureSlotTime();

    await expectValidationRejection(
      createOrder({
        user_id: user.id,
        shop_id: shop.id,
        payment_method: "CASH",
        delivery_address_id: address.id,
        requested_delivery_time: at,
      }),
      /no batch cards configured/i
    );
    await assertNothingWritten();
  });

  it("rejects a requested time that matches no active slot's cutoff minute", async () => {
    const { user, shop, address } = seeded;
    const { at, cutoffMinutes } = futureSlotTime();
    await createBatchSlot({
      shop_id: shop.id,
      cutoff_time_minutes: cutoffMinutes,
    });
    const mismatchedTime = new Date(at.getTime() + 5 * 60_000);

    await expectValidationRejection(
      createOrder({
        user_id: user.id,
        shop_id: shop.id,
        payment_method: "CASH",
        delivery_address_id: address.id,
        requested_delivery_time: mismatchedTime,
      }),
      /not available/i
    );
    await assertNothingWritten();
  });

  it("rejects when the existing batch at that cutoff is LOCKED", async () => {
    const { user, shop, address } = seeded;
    const { at, cutoffMinutes } = futureSlotTime();
    const slot = await createBatchSlot({
      shop_id: shop.id,
      cutoff_time_minutes: cutoffMinutes,
    });
    await testPrisma.batch.create({
      data: {
        shop_id: shop.id,
        slot_id: slot.id,
        cutoff_time: at,
        status: "LOCKED",
      },
    });

    await expectValidationRejection(
      createOrder({
        user_id: user.id,
        shop_id: shop.id,
        payment_method: "CASH",
        delivery_address_id: address.id,
        requested_delivery_time: at,
      }),
      /already been locked/i
    );
    await expect(testPrisma.order.count()).resolves.toBe(0);
    await expect(testPrisma.batch.count()).resolves.toBe(1);
  });

  it("rejects when the existing batch at that cutoff is CANCELLED", async () => {
    const { user, shop, address } = seeded;
    const { at, cutoffMinutes } = futureSlotTime();
    const slot = await createBatchSlot({
      shop_id: shop.id,
      cutoff_time_minutes: cutoffMinutes,
    });
    await testPrisma.batch.create({
      data: {
        shop_id: shop.id,
        slot_id: slot.id,
        cutoff_time: at,
        status: "CANCELLED",
      },
    });

    await expectValidationRejection(
      createOrder({
        user_id: user.id,
        shop_id: shop.id,
        payment_method: "CASH",
        delivery_address_id: address.id,
        requested_delivery_time: at,
      }),
      /Cancelled/
    );
    await expect(testPrisma.order.count()).resolves.toBe(0);
    await expect(testPrisma.batch.count()).resolves.toBe(1);
  });
});
