// Cross-shop IDOR: the owner of shop A acting on shop B's resources.
// tests/integration/authz/idor.test.ts already covers accept/reject order
// and product update/delete; this covers the rest.
import { describe, expect, it } from "vitest";

import { removeShopDeliveryBuildingAction } from "../../../src/actions/building/building-actions";
import {
  toggleProductStockAction,
  updateProductPriceAction,
} from "../../../src/actions/product/product-actions";
import * as shopBatch from "../../../src/actions/shop/batch-actions";
import { rejectOrderAction } from "../../../src/actions/shop/order-management-actions";
import {
  createAnnouncementAction,
  deleteAnnouncementAction,
} from "../../../src/actions/vendor/announcement-actions";
import * as vendorBatch from "../../../src/actions/vendor/batch-actions";
import {
  deleteBatchSlotAction,
  listBatchSlotsAction,
  reorderBatchSlotsAction,
  updateBatchSlotAction,
} from "../../../src/actions/vendor/batch-slot-actions";
import { startIndividualDeliveryAction } from "../../../src/actions/vendor/individual-delivery-actions";
import { GET as GET_SEARCH_ORDERS } from "../../../src/app/api/search/orders/route";
import { GET as GET_VENDOR_ANNOUNCEMENTS } from "../../../src/app/api/vendor/announcements/route";
import { GET as GET_VENDOR_BUILDINGS } from "../../../src/app/api/vendor/delivery-buildings/route";
import { GET as GET_VENDOR_EARNINGS } from "../../../src/app/api/vendor/earnings/route";
import { GET as GET_VENDOR_CONSOLE } from "../../../src/app/api/vendor/orders/console/route";
import { GET as GET_VENDOR_HISTORY } from "../../../src/app/api/vendor/orders/history/route";
import type { BatchStatus } from "../../../src/generated/client";
import {
  createBatchSlot,
  createOrderAtStatus,
  seedShopWithProducts,
} from "../../factories";
import {
  expectDenied,
  expectRejectedWith,
  FORBIDDEN_ERRORS,
  req,
} from "../../helpers/authz";
import { asUser } from "../../setup/auth";
import { testPrisma } from "../../setup/integration-setup";

async function twoShops() {
  const a = await seedShopWithProducts({ productCount: 1 });
  const b = await seedShopWithProducts({ productCount: 1 });
  return { a, b };
}

describe("a vendor cannot change another shop's product stock or price", () => {
  it("toggleProductStockAction and updateProductPriceAction on shop B's product are rejected and the row is unchanged", async () => {
    const { a, b } = await twoShops();
    const foreign = b.products[0];
    asUser(a.owner);

    await expectRejectedWith(
      () => toggleProductStockAction(foreign.id, false),
      ["ForbiddenError"]
    );
    await expectRejectedWith(
      () => updateProductPriceAction(foreign.id, 1),
      ["ForbiddenError"]
    );

    const after = await testPrisma.product.findUniqueOrThrow({
      where: { id: foreign.id },
    });
    expect(after.stock_quantity).toBe(foreign.stock_quantity);
    expect(after.price.toString()).toBe(foreign.price.toString());
  });
});

describe("announcements are scoped to the owner's shop", () => {
  it("deleting shop B's announcement is rejected and the row survives", async () => {
    const { a, b } = await twoShops();
    const ann = await testPrisma.shopAnnouncement.create({
      data: {
        shop_id: b.shop.id,
        title: "B promo",
        message: "B only",
        expires_at: new Date(Date.now() + 3_600_000),
      },
    });
    asUser(a.owner);

    await expectDenied(() => deleteAnnouncementAction(ann.id), [b.shop.id]);
    expect(
      await testPrisma.shopAnnouncement.findUnique({ where: { id: ann.id } })
    ).not.toBeNull();
  });

  it("an announcement cannot feature another shop's product", async () => {
    const { a, b } = await twoShops();
    asUser(a.owner);

    await expectDenied(() =>
      createAnnouncementAction({
        title: "steal",
        message: "B's product",
        expires_at: new Date(Date.now() + 3_600_000),
        product_id: b.products[0].id,
      })
    );
    expect(await testPrisma.shopAnnouncement.count()).toBe(0);
  });

  it("GET /api/vendor/announcements lists only the caller's shop", async () => {
    const { a, b } = await twoShops();
    for (const shop of [a.shop, b.shop]) {
      await testPrisma.shopAnnouncement.create({
        data: {
          shop_id: shop.id,
          title: `title of ${shop.id}`,
          message: "m",
          expires_at: new Date(Date.now() + 3_600_000),
        },
      });
    }
    asUser(a.owner);
    const text = await (
      await GET_VENDOR_ANNOUNCEMENTS(req("/api/vendor/announcements"))
    ).text();
    expect(text).toContain(`title of ${a.shop.id}`);
    expect(text).not.toContain(`title of ${b.shop.id}`);
  });
});

describe("batch slots are scoped to the owner's shop", () => {
  it("updating, deleting or reordering shop B's slot is rejected and the slot is unchanged; the list shows only A's slots", async () => {
    const { a, b } = await twoShops();
    const own = await createBatchSlot({
      shop_id: a.shop.id,
      cutoff_time_minutes: 600,
    });
    const foreign = await createBatchSlot({
      shop_id: b.shop.id,
      cutoff_time_minutes: 720,
      label: "B slot",
    });
    asUser(a.owner);

    await expectDenied(() =>
      updateBatchSlotAction({
        id: foreign.id,
        cutoff_time_minutes: 1,
        label: "hijack",
        is_active: false,
      })
    );
    await expectDenied(() => deleteBatchSlotAction(foreign.id));
    await expectDenied(() =>
      reorderBatchSlotsAction({ ordered_ids: [foreign.id, own.id] })
    );

    const after = await testPrisma.batchSlot.findUniqueOrThrow({
      where: { id: foreign.id },
    });
    expect(after.cutoff_time_minutes).toBe(720);
    expect(after.label).toBe("B slot");
    expect(after.is_active).toBe(true);
    expect(after.sort_order).toBe(foreign.sort_order);

    const list = await listBatchSlotsAction();
    expect(list.data?.map((s) => s.id)).toEqual([own.id]);
  });
});

async function foreignBatch(shop_id: string, status: BatchStatus) {
  const slot = await createBatchSlot({ shop_id, cutoff_time_minutes: 900 });
  return testPrisma.batch.create({
    data: {
      shop_id,
      slot_id: slot.id,
      status,
      cutoff_time: new Date(Date.now() + 3_600_000),
    },
  });
}

describe("a vendor cannot drive another shop's batch", () => {
  const cases: Array<[string, BatchStatus, (id: string) => Promise<unknown>]> =
    [
      [
        "vendor lockBatchAction",
        "OPEN",
        (id) => vendorBatch.lockBatchAction(id),
      ],
      [
        "vendor startBatchDeliveryAction",
        "LOCKED",
        (id) => vendorBatch.startBatchDeliveryAction(id),
      ],
      [
        "vendor unlockBatchAction",
        "LOCKED",
        (id) => vendorBatch.unlockBatchAction(id),
      ],
      [
        "vendor completeBatchAction",
        "IN_TRANSIT",
        (id) => vendorBatch.completeBatchAction(id),
      ],
      [
        "vendor cancelBatchAction",
        "LOCKED",
        (id) => vendorBatch.cancelBatchAction(id, "x"),
      ],
      [
        "vendor updateBatchMilestoneAction",
        "IN_TRANSIT",
        (id) =>
          vendorBatch.updateBatchMilestoneAction({
            batchId: id,
            milestone: "ARRIVED",
          }),
      ],
      [
        "shop updateBatchCutoffTimeAction",
        "OPEN",
        (id) =>
          shopBatch.updateBatchCutoffTimeAction(
            id,
            new Date(Date.now() + 7_200_000)
          ),
      ],
      ["shop closeBatchAction", "OPEN", (id) => shopBatch.closeBatchAction(id)],
      [
        "shop forceLockBatchAction",
        "PENDING_REVIEW",
        (id) => shopBatch.forceLockBatchAction(id),
      ],
      [
        "shop cancelBatchAction",
        "LOCKED",
        (id) => shopBatch.cancelBatchAction(id, "x"),
      ],
    ];

  for (const [name, status, run] of cases) {
    it(`${name} on shop B's ${status} batch is rejected and the batch is unchanged`, async () => {
      const { a, b } = await twoShops();
      const batch = await foreignBatch(b.shop.id, status);
      asUser(a.owner);

      await expectDenied(() => run(batch.id), [b.shop.id]);

      const after = await testPrisma.batch.findUniqueOrThrow({
        where: { id: batch.id },
        include: { delivery_status: true },
      });
      expect(after.status).toBe(status);
      expect(after.cutoff_time.getTime()).toBe(batch.cutoff_time.getTime());
      expect(after.delivery_status).toBeNull();
    });
  }
});

describe("a vendor cannot deliver or read another shop's orders", () => {
  it("startIndividualDeliveryAction and verifyOrderOtpAction on shop B's order are rejected and the order is unchanged", async () => {
    const { a, b } = await twoShops();
    const order = await createOrderAtStatus({
      shop_id: b.shop.id,
      order_status: "NEW",
    });
    const outForDelivery = await createOrderAtStatus({
      shop_id: b.shop.id,
      order_status: "OUT_FOR_DELIVERY",
    });
    await testPrisma.order.update({
      where: { id: outForDelivery.id },
      data: { delivery_otp: "1234" },
    });
    asUser(a.owner);

    await expectDenied(
      () => startIndividualDeliveryAction(order.id),
      [order.display_id]
    );
    await expectDenied(
      () => vendorBatch.verifyOrderOtpAction(outForDelivery.id, "1234"),
      [outForDelivery.display_id]
    );

    expect(
      (await testPrisma.order.findUniqueOrThrow({ where: { id: order.id } }))
        .order_status
    ).toBe("NEW");
    expect(
      (
        await testPrisma.order.findUniqueOrThrow({
          where: { id: outForDelivery.id },
        })
      ).order_status
    ).toBe("OUT_FOR_DELIVERY");
  });

  it("vendor order history, console, order search and earnings contain only the caller's shop", async () => {
    const { a, b } = await twoShops();
    const own = await createOrderAtStatus({
      shop_id: a.shop.id,
      order_status: "COMPLETED",
      payment_status: "COMPLETED",
    });
    const foreign = await createOrderAtStatus({
      shop_id: b.shop.id,
      order_status: "COMPLETED",
      payment_status: "COMPLETED",
    });
    const foreignActive = await createOrderAtStatus({
      shop_id: b.shop.id,
      order_status: "OUT_FOR_DELIVERY",
    });
    asUser(a.owner);

    const bodies = [
      await (
        await GET_VENDOR_HISTORY(req("/api/vendor/orders/history"))
      ).text(),
      await (await GET_VENDOR_CONSOLE()).text(),
      await (await GET_SEARCH_ORDERS(req("/api/search/orders"))).text(),
      await (await GET_VENDOR_EARNINGS(req("/api/vendor/earnings"))).text(),
    ];
    for (const body of bodies) {
      expect(body).not.toContain(foreign.display_id);
      expect(body).not.toContain(foreignActive.display_id);
      expect(body).not.toContain(b.shop.id);
    }
    expect(bodies[0]).toContain(own.display_id);
  });
});

describe("delivery-building links are scoped to the owner's shop", () => {
  it("removing a building only deactivates the caller's own link, never shop B's", async () => {
    const { a, b } = await twoShops();
    const foreignLink = await testPrisma.shopDeliveryBuilding.create({
      data: { shop_id: b.shop.id, building_id: "bld-test-1", is_active: true },
    });
    asUser(a.owner);

    await removeShopDeliveryBuildingAction("bld-test-1");

    const after = await testPrisma.shopDeliveryBuilding.findUniqueOrThrow({
      where: { id: foreignLink.id },
    });
    expect(after.is_active).toBe(true);

    const res = await GET_VENDOR_BUILDINGS();
    expect(await res.text()).not.toContain(foreignLink.id);
  });
});

describe("cross-owner by-id denials are forbidden-class errors", () => {
  it("every by-id vendor action on shop B's resource rejects shop A's owner with a 403-class error", async () => {
    const { a, b } = await twoShops();
    const announcement = await testPrisma.shopAnnouncement.create({
      data: {
        shop_id: b.shop.id,
        title: "t",
        message: "m",
        expires_at: new Date(Date.now() + 3_600_000),
      },
    });
    const slot = await createBatchSlot({
      shop_id: b.shop.id,
      cutoff_time_minutes: 600,
    });
    const lockedBatch = await foreignBatch(b.shop.id, "LOCKED");
    const openBatch = await foreignBatch(b.shop.id, "OPEN");
    const order = await createOrderAtStatus({
      shop_id: b.shop.id,
      order_status: "BATCHED",
    });
    asUser(a.owner);

    const calls: Array<[string, () => Promise<unknown>]> = [
      [
        "deleteAnnouncementAction",
        () => deleteAnnouncementAction(announcement.id),
      ],
      [
        "updateBatchSlotAction",
        () => updateBatchSlotAction({ id: slot.id, cutoff_time_minutes: 700 }),
      ],
      ["deleteBatchSlotAction", () => deleteBatchSlotAction(slot.id)],
      [
        "vendor startBatchDeliveryAction",
        () => vendorBatch.startBatchDeliveryAction(lockedBatch.id),
      ],
      ["shop closeBatchAction", () => shopBatch.closeBatchAction(openBatch.id)],
      [
        "startIndividualDeliveryAction",
        () => startIndividualDeliveryAction(order.id),
      ],
      ["rejectOrderAction", () => rejectOrderAction(order.id)],
    ];
    for (const [label, run] of calls) {
      await expectRejectedWith(run, FORBIDDEN_ERRORS, label);
    }
  });
});
