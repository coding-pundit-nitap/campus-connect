import { beforeEach, describe, expect, it } from "vitest";

import {
  getAllPayoutsAction,
  getPayoutStatsAction,
  updatePayoutStatusAction,
} from "@/actions/admin/payout-actions";
import {
  ForbiddenError,
  InternalServerError,
  NotFoundError,
} from "@/lib/custom-error";

import { createShop, createUser } from "../../factories";
import { asAnonymous, asUser } from "../../setup/auth";
import { testPrisma } from "../../setup/integration-setup";

describe("Admin Payout Actions Integration", () => {
  let admin: Awaited<ReturnType<typeof createUser>>;
  let user: Awaited<ReturnType<typeof createUser>>;
  let shop: Awaited<ReturnType<typeof createShop>>;

  beforeEach(async () => {
    admin = await createUser({ role: "ADMIN" });
    user = await createUser({ role: "USER" });
    shop = await createShop();
  });

  describe("getAllPayoutsAction", () => {
    it("should reject anonymous users", async () => {
      asAnonymous();
      await expect(getAllPayoutsAction({ limit: 10 })).rejects.toThrow(
        InternalServerError
      );
    });

    it("should reject non-admin users", async () => {
      asUser({ id: user.id, role: "USER" });
      await expect(getAllPayoutsAction({ limit: 10 })).rejects.toThrow(
        ForbiddenError
      );
    });

    it("should return payouts for admin", async () => {
      asUser({ id: admin.id, role: "ADMIN" });

      await testPrisma.payout.create({
        data: {
          amount: 100.5,
          status: "PENDING",
          pg_payout_id: "po_12345",
          arrival_date: new Date(),
          shop_id: shop.id,
        },
      });

      const response = await getAllPayoutsAction({ limit: 10 });
      expect(response.success).toBe(true);
      expect(response.data?.data).toHaveLength(1);
      expect(response.data?.data[0].amount).toBe(100.5);
      expect(response.data?.data[0].status).toBe("PENDING");
      expect(response.data?.data[0].pg_payout_id).toBe("po_12345");
      expect(response.data?.data[0].shop?.id).toBe(shop.id);
    });

    it("should support pagination", async () => {
      asUser({ id: admin.id, role: "ADMIN" });

      // Create 15 payouts
      const promises = Array.from({ length: 15 }).map((_, i) =>
        testPrisma.payout.create({
          data: {
            amount: 10 + i,
            status: "PAID",
            pg_payout_id: `po_page_${i}`,
            arrival_date: new Date(),
            shop_id: shop.id,
          },
        })
      );
      await Promise.all(promises);

      const firstPage = await getAllPayoutsAction({ limit: 10 });
      expect(firstPage.data?.data).toHaveLength(10);
      expect(firstPage.data?.hasMore).toBe(true);
      expect(firstPage.data?.nextCursor).toBeTruthy();

      const secondPage = await getAllPayoutsAction({
        limit: 10,
        cursor: firstPage.data?.nextCursor as string,
      });
      expect(secondPage.data?.data).toHaveLength(5);
      expect(secondPage.data?.hasMore).toBe(false);
    });

    it("should filter by status and shop_id", async () => {
      asUser({ id: admin.id, role: "ADMIN" });

      const otherShop = await createShop();

      await testPrisma.payout.create({
        data: {
          amount: 50,
          status: "PENDING",
          pg_payout_id: "po_filter_1",
          arrival_date: new Date(),
          shop_id: shop.id,
        },
      });

      await testPrisma.payout.create({
        data: {
          amount: 60,
          status: "PAID",
          pg_payout_id: "po_filter_2",
          arrival_date: new Date(),
          shop_id: otherShop.id,
        },
      });

      const pendingResponse = await getAllPayoutsAction({
        limit: 10,
        status: "PENDING",
      });
      expect(pendingResponse.data?.data).toHaveLength(1);
      expect(pendingResponse.data?.data[0].pg_payout_id).toBe("po_filter_1");

      const shopResponse = await getAllPayoutsAction({
        limit: 10,
        shop_id: otherShop.id,
      });
      expect(shopResponse.data?.data).toHaveLength(1);
      expect(shopResponse.data?.data[0].pg_payout_id).toBe("po_filter_2");
    });
  });

  describe("updatePayoutStatusAction", () => {
    it("should reject anonymous users", async () => {
      asAnonymous();
      await expect(
        updatePayoutStatusAction({ payout_id: "some_id", status: "PAID" })
      ).rejects.toThrow(InternalServerError);
    });

    it("should reject non-admin users", async () => {
      asUser({ id: user.id, role: "USER" });
      await expect(
        updatePayoutStatusAction({ payout_id: "some_id", status: "PAID" })
      ).rejects.toThrow(ForbiddenError);
    });

    it("should update payout status", async () => {
      asUser({ id: admin.id, role: "ADMIN" });

      const payout = await testPrisma.payout.create({
        data: {
          amount: 200,
          status: "PENDING",
          pg_payout_id: "po_update_1",
          arrival_date: new Date(),
          shop_id: shop.id,
        },
      });

      const response = await updatePayoutStatusAction({
        payout_id: payout.id,
        status: "PAID",
      });

      expect(response.success).toBe(true);
      expect(response.data?.status).toBe("PAID");

      // Verify in DB
      const updated = await testPrisma.payout.findUnique({
        where: { id: payout.id },
      });
      expect(updated?.status).toBe("PAID");
    });

    it("should log action in AdminAudit", async () => {
      asUser({ id: admin.id, role: "ADMIN" });

      const payout = await testPrisma.payout.create({
        data: {
          amount: 200,
          status: "PENDING",
          pg_payout_id: "po_audit_1",
          arrival_date: new Date(),
          shop_id: shop.id,
        },
      });

      await updatePayoutStatusAction({
        payout_id: payout.id,
        status: "FAILED",
      });

      const audit = await testPrisma.adminAuditLog.findFirst({
        where: { target_id: payout.id, target_type: "PAYOUT" },
      });

      expect(audit).toBeTruthy();
      expect(audit?.admin_id).toBe(admin.id);
      expect(audit?.action).toBe("ORDER_STATUS_OVERRIDE"); // As per the current implementation in payout-actions.ts
    });

    it("should throw NotFoundError for invalid payout_id", async () => {
      asUser({ id: admin.id, role: "ADMIN" });

      await expect(
        updatePayoutStatusAction({ payout_id: "invalid_id", status: "PAID" })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("getPayoutStatsAction", () => {
    it("should reject anonymous users", async () => {
      asAnonymous();
      await expect(getPayoutStatsAction()).rejects.toThrow(InternalServerError);
    });

    it("should reject non-admin users", async () => {
      asUser({ id: user.id, role: "USER" });
      await expect(getPayoutStatsAction()).rejects.toThrow(ForbiddenError);
    });

    it("should return correct stats", async () => {
      asUser({ id: admin.id, role: "ADMIN" });

      await testPrisma.payout.createMany({
        data: [
          {
            amount: 100,
            status: "PENDING",
            pg_payout_id: "po_stats_1",
            arrival_date: new Date(),
            shop_id: shop.id,
          },
          {
            amount: 200,
            status: "IN_TRANSIT",
            pg_payout_id: "po_stats_2",
            arrival_date: new Date(),
            shop_id: shop.id,
          },
          {
            amount: 300,
            status: "PAID",
            pg_payout_id: "po_stats_3",
            arrival_date: new Date(),
            shop_id: shop.id,
          },
          {
            amount: 400,
            status: "PAID",
            pg_payout_id: "po_stats_4",
            arrival_date: new Date(),
            shop_id: shop.id,
          },
          {
            amount: 50,
            status: "FAILED",
            pg_payout_id: "po_stats_5",
            arrival_date: new Date(),
            shop_id: shop.id,
          },
        ],
      });

      const response = await getPayoutStatsAction();
      expect(response.success).toBe(true);

      const stats = response.data;
      expect(stats?.totalPayouts).toBe(5);
      expect(stats?.pendingPayouts).toBe(1);
      expect(stats?.inTransitPayouts).toBe(1);
      expect(stats?.paidPayouts).toBe(2);
      expect(stats?.failedPayouts).toBe(1);
      expect(stats?.totalPendingAmount).toBe(300); // PENDING + IN_TRANSIT (100+200)
      expect(stats?.totalPaidAmount).toBe(700); // PAID (300+400)
    });
  });
});
