// RULE A7: every admin server action is ADMIN-only (src/lib/verify-admin.ts
// docstring; rbac.ts "Admin-only routes that require ADMIN role").
// A signed-out caller gets an auth error, a signed-in non-admin (plain user
// or shop owner) gets ForbiddenError, and nothing is changed either way.
import { describe, expect, it } from "vitest";

import * as admin from "../../../../src/actions/admin";
import {
  getCleanupStatsAction,
  getPlatformOverviewAction,
  getPlatformSettingsAction,
  getSystemHealthAction,
  runCleanupAction,
  updatePlatformFeeAction,
} from "../../../../src/actions/admin/settings-actions";
import {
  createOrderAtStatus,
  createUser,
  seedShopWithProducts,
} from "../../../factories";
import {
  expectRejectedWith,
  SIGNED_OUT_ERRORS,
} from "../../../helpers/spec-authz";
import { asAnonymous, asUser } from "../../../setup/auth";
import { testPrisma } from "../../../setup/integration-setup";

async function seedTargets() {
  const { shop, owner, products } = await seedShopWithProducts({
    productCount: 1,
    shopOverrides: { is_active: false, verification_status: "PENDING" },
  });
  const victim = await createUser();
  const order = await createOrderAtStatus({
    shop_id: shop.id,
    order_status: "NEW",
    user_id: victim.id,
  });
  const orderItem = await testPrisma.orderItem.create({
    data: {
      order_id: order.id,
      product_id: products[0].id,
      quantity: 1,
      price: 100,
    },
  });
  const review = await testPrisma.review.create({
    data: {
      rating: 5,
      comment: "great",
      user_id: victim.id,
      product_id: products[0].id,
      order_item_id: orderItem.id,
    },
  });
  const payout = await testPrisma.payout.create({
    data: {
      amount: 100,
      pg_payout_id: `po-${shop.id}`,
      arrival_date: new Date(),
      shop_id: shop.id,
    },
  });
  await testPrisma.notification.create({
    data: {
      user_id: victim.id,
      title: "old",
      message: "old",
      read: true,
      created_at: new Date("2000-01-01"),
    },
  });
  return { shop, owner, product: products[0], victim, order, review, payout };
}

type Targets = Awaited<ReturnType<typeof seedTargets>>;

function adminCalls(t: Targets): Array<[string, () => Promise<unknown>]> {
  return [
    ["getDashboardAnalyticsAction", () => admin.getDashboardAnalyticsAction()],
    ["getAuditLogsAction", () => admin.getAuditLogsAction({ limit: 10 })],
    ["getAuditLogStatsAction", () => admin.getAuditLogStatsAction()],
    ["getRecentAuditLogsAction", () => admin.getRecentAuditLogsAction()],
    [
      "sendBroadcastNotificationAction",
      () => admin.sendBroadcastNotificationAction({ title: "x", message: "y" }),
    ],
    ["getBroadcastStatsAction", () => admin.getBroadcastStatsAction()],
    [
      "getAllCategoriesAction",
      () => admin.getAllCategoriesAction({ limit: 10 }),
    ],
    ["getCategoryStatsAction", () => admin.getCategoryStatsAction()],
    ["getAllOrdersAction", () => admin.getAllOrdersAction({ limit: 10 })],
    ["getOrderStatsAction", () => admin.getOrderStatsAction()],
    [
      "updateOrderStatusAdminAction",
      () =>
        admin.updateOrderStatusAdminAction({
          order_id: t.order.id,
          order_status: "CANCELLED",
        }),
    ],
    [
      "updatePaymentStatusAction",
      () =>
        admin.updatePaymentStatusAction({
          order_id: t.order.id,
          payment_status: "REFUNDED",
        }),
    ],
    ["getAllPayoutsAction", () => admin.getAllPayoutsAction({ limit: 10 })],
    ["getPayoutStatsAction", () => admin.getPayoutStatsAction()],
    [
      "updatePayoutStatusAction",
      () =>
        admin.updatePayoutStatusAction({
          payout_id: t.payout.id,
          status: "PAID",
        }),
    ],
    ["getAllProductsAction", () => admin.getAllProductsAction({ limit: 10 })],
    [
      "admin deleteProductAction",
      () => admin.deleteProductAction(t.product.id),
    ],
    ["getProductStatsAction", () => admin.getProductStatsAction()],
    ["getAllReviewsAction", () => admin.getAllReviewsAction({ limit: 10 })],
    ["deleteReviewAction", () => admin.deleteReviewAction(t.review.id)],
    ["getReviewStatsAction", () => admin.getReviewStatsAction()],
    ["getAllShopsAction", () => admin.getAllShopsAction({ limit: 10 })],
    ["activateShopAction", () => admin.activateShopAction(t.shop.id)],
    ["deactivateShopAction", () => admin.deactivateShopAction(t.shop.id)],
    ["admin deleteShopAction", () => admin.deleteShopAction(t.shop.id)],
    [
      "updateShopVerificationAction",
      () => admin.updateShopVerificationAction(t.shop.id, "VERIFIED"),
    ],
    ["getShopStatsAction", () => admin.getShopStatsAction()],
    ["getAllUsersAction", () => admin.getAllUsersAction({ limit: 10 })],
    ["makeUserAdminAction", () => admin.makeUserAdminAction(t.victim.id)],
    ["removeUserAdminAction", () => admin.removeUserAdminAction(t.victim.id)],
    ["getUserStatsAction", () => admin.getUserStatsAction()],
    ["forceSignOutUserAction", () => admin.forceSignOutUserAction(t.victim.id)],
    ["deleteUserAction", () => admin.deleteUserAction(t.victim.id)],
    ["suspendUserAction", () => admin.suspendUserAction(t.victim.id, "spam")],
    ["unsuspendUserAction", () => admin.unsuspendUserAction(t.victim.id)],
    ["getSystemHealthAction", () => getSystemHealthAction()],
    ["getCleanupStatsAction", () => getCleanupStatsAction()],
    ["runCleanupAction", () => runCleanupAction("notifications")],
    ["getPlatformOverviewAction", () => getPlatformOverviewAction()],
    ["getPlatformSettingsAction", () => getPlatformSettingsAction()],
    ["updatePlatformFeeAction", () => updatePlatformFeeAction(99)],
  ];
}

async function snapshot(t: Targets) {
  return {
    shop: await testPrisma.shop.findUnique({
      where: { id: t.shop.id },
      select: { is_active: true, verification_status: true },
    }),
    product: await testPrisma.product.findUnique({
      where: { id: t.product.id },
      select: { deleted_at: true },
    }),
    order: await testPrisma.order.findUnique({
      where: { id: t.order.id },
      select: { order_status: true, payment_status: true },
    }),
    review: await testPrisma.review.findUnique({
      where: { id: t.review.id },
      select: { id: true },
    }),
    payout: await testPrisma.payout.findUnique({
      where: { id: t.payout.id },
      select: { status: true },
    }),
    victim: await testPrisma.user.findUnique({
      where: { id: t.victim.id },
      select: { role: true, status: true },
    }),
    broadcasts: await testPrisma.broadcastNotification.count(),
    notifications: await testPrisma.notification.count(),
    settings: await testPrisma.platformSettings.findMany(),
    auditLogs: await testPrisma.adminAuditLog.count(),
  };
}

describe("RULE A7: every admin action is ADMIN-only", () => {
  it("RULE A7: a signed-in plain user gets ForbiddenError from every admin action and nothing changes", async () => {
    const t = await seedTargets();
    const before = await snapshot(t);
    asUser(await createUser({ role: "USER" }));

    for (const [name, run] of adminCalls(t)) {
      await expectRejectedWith(run, ["ForbiddenError"], name);
    }
    expect(await snapshot(t)).toEqual(before);
  });

  it("RULE A7: a shop owner (non-admin) gets ForbiddenError from every admin action, including on their own shop", async () => {
    const t = await seedTargets();
    const before = await snapshot(t);
    asUser(t.owner);

    for (const [name, run] of adminCalls(t)) {
      await expectRejectedWith(run, ["ForbiddenError"], name);
    }
    expect(await snapshot(t)).toEqual(before);
  });

  it("RULE A7/A6: a signed-out caller gets an auth error (never an InternalServerError) from every admin action and nothing changes", async () => {
    const t = await seedTargets();
    const before = await snapshot(t);
    asAnonymous();

    for (const [name, run] of adminCalls(t)) {
      await expectRejectedWith(run, SIGNED_OUT_ERRORS, name);
    }
    expect(await snapshot(t)).toEqual(before);
  });

  it("RULE A7: an ADMIN is let through (the guard is the only thing in the way)", async () => {
    const t = await seedTargets();
    asUser(await createUser({ role: "ADMIN" }));

    const res = await admin.updateShopVerificationAction(t.shop.id, "VERIFIED");
    expect(res.success).toBe(true);
    const shop = await testPrisma.shop.findUniqueOrThrow({
      where: { id: t.shop.id },
    });
    expect(shop.verification_status).toBe("VERIFIED");
  });
});
