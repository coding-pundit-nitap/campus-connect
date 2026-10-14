import type { PrismaMock } from "@tests/helpers";
import {
  ADMIN_ID,
  asAdmin,
  itGuardsAdminAccess,
} from "@tests/helpers/actions-admin";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { container } from "@/di/container";
import { ValidationError } from "@/lib/custom-error";

import {
  getCleanupStatsAction,
  getPlatformOverviewAction,
  getPlatformSettingsAction,
  getSystemHealthAction,
  runCleanupAction,
  updatePlatformFeeAction,
} from "./settings-actions";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers/actions-admin/mocks")).adminContainerModule()
);
vi.mock("@/lib/verify-admin", async () =>
  (await import("@tests/helpers/actions-admin/mocks")).verifyAdminModule()
);

const c = vi.mocked(container, true);
const db = container.db as unknown as PrismaMock;

describe("admin settings actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asAdmin();
  });

  describe("getSystemHealthAction", () => {
    itGuardsAdminAccess(
      () => getSystemHealthAction(),
      "Failed to check system health."
    );

    it("pings the database and sums record counts", async () => {
      const oldest = new Date("2025-01-01");
      const newest = new Date("2026-01-01");
      db.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);
      c.userRepository.count.mockResolvedValue(1);
      c.shopRepository.count.mockResolvedValue(2);
      c.orderRepository.count.mockResolvedValue(3);
      c.productRepository.count.mockResolvedValue(4);
      c.adminAuditRepository.aggregate.mockResolvedValue({
        _min: { created_at: oldest },
        _max: { created_at: newest },
      } as never);

      const res = await getSystemHealthAction();

      expect(db.$queryRaw).toHaveBeenCalled();
      expect(res.data).toEqual({
        database: { connected: true, responseTime: expect.any(Number) },
        stats: {
          totalRecords: 10,
          oldestAuditLog: oldest,
          newestAuditLog: newest,
        },
      });
    });

    it("reports null audit log bounds when there are no logs", async () => {
      c.userRepository.count.mockResolvedValue(0);
      c.shopRepository.count.mockResolvedValue(0);
      c.orderRepository.count.mockResolvedValue(0);
      c.productRepository.count.mockResolvedValue(0);
      c.adminAuditRepository.aggregate.mockResolvedValue({} as never);

      const res = await getSystemHealthAction();

      expect(res.data?.stats.oldestAuditLog).toBeNull();
      expect(res.data?.stats.newestAuditLog).toBeNull();
    });
  });

  describe("getCleanupStatsAction", () => {
    itGuardsAdminAccess(
      () => getCleanupStatsAction(),
      "Failed to get cleanup statistics."
    );

    it("counts cleanable records", async () => {
      c.notificationRepository.count.mockResolvedValue(5);
      c.adminAuditRepository.count.mockResolvedValue(6);
      db.session.count.mockResolvedValue(7);
      c.cartRepository.count.mockResolvedValue(8);

      const res = await getCleanupStatsAction();

      expect(c.notificationRepository.count).toHaveBeenCalledWith({
        where: { read: true, created_at: { lt: expect.any(Date) } },
      });
      expect(res.data).toEqual({
        oldNotifications: 5,
        oldAuditLogs: 6,
        expiredSessions: 7,
        orphanedCarts: 8,
      });
    });
  });

  describe("runCleanupAction", () => {
    itGuardsAdminAccess(
      () => runCleanupAction("sessions"),
      "Failed to run cleanup."
    );

    it.each([
      [
        "notifications",
        "notification",
        { read: true, created_at: { lt: expect.any(Date) } },
      ],
      ["sessions", "session", { expiresAt: { lt: expect.any(Date) } }],
      ["carts", "cart", { items: { none: {} } }],
    ] as const)(
      "deletes old %s and audits the cleanup",
      async (type, model, where) => {
        db[model].deleteMany.mockResolvedValue({ count: 3 });

        const res = await runCleanupAction(type);

        expect(db[model].deleteMany).toHaveBeenCalledWith({ where });
        expect(c.adminAuditRepository.create).toHaveBeenCalledWith({
          data: {
            admin_id: ADMIN_ID,
            action: "ORDER_STATUS_OVERRIDE",
            target_type: "CLEANUP",
            target_id: type.toUpperCase(),
            details: { deleted_count: 3 },
          },
        });
        expect(res.data).toEqual({ deletedCount: 3 });
        expect(res.details).toBe(`Cleaned up 3 ${type}`);
      }
    );
  });

  describe("getPlatformOverviewAction", () => {
    itGuardsAdminAccess(
      () => getPlatformOverviewAction(),
      "Failed to get platform overview."
    );

    it("assembles the overview from all repositories", async () => {
      [10, 8, 2, 1].forEach((n) =>
        c.userRepository.count.mockResolvedValueOnce(n)
      );
      [5, 4, 3, 1].forEach((n) =>
        c.shopRepository.count.mockResolvedValueOnce(n)
      );
      [20, 15].forEach((n) =>
        c.productRepository.count.mockResolvedValueOnce(n)
      );
      [30, 6, 20, 4].forEach((n) =>
        c.orderRepository.count.mockResolvedValueOnce(n)
      );
      c.reviewRepository.count.mockResolvedValue(9);
      c.reviewRepository.aggregate.mockResolvedValue({
        _avg: { rating: 4.5 },
      } as never);
      c.payoutRepository.count
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(11);
      c.payoutRepository.aggregate.mockResolvedValue({
        _sum: { amount: "99.5" },
      } as never);

      const res = await getPlatformOverviewAction();

      expect(res.data).toEqual({
        users: { total: 10, active: 8, admins: 2, suspended: 1 },
        shops: { total: 5, active: 4, verified: 3, pending: 1 },
        products: { total: 20, inStock: 15, outOfStock: 5 },
        orders: { total: 30, pending: 6, completed: 20, cancelled: 4 },
        reviews: { total: 9, averageRating: 4.5 },
        payouts: { pending: 2, completed: 11, totalPending: 99.5 },
      });
    });

    it("defaults missing aggregates to zero", async () => {
      c.userRepository.count.mockResolvedValue(0);
      c.shopRepository.count.mockResolvedValue(0);
      c.productRepository.count.mockResolvedValue(0);
      c.orderRepository.count.mockResolvedValue(0);
      c.reviewRepository.count.mockResolvedValue(0);
      c.reviewRepository.aggregate.mockResolvedValue({} as never);
      c.payoutRepository.count.mockResolvedValue(0);
      c.payoutRepository.aggregate.mockResolvedValue({} as never);

      const res = await getPlatformOverviewAction();

      expect(res.data?.reviews.averageRating).toBe(0);
      expect(res.data?.payouts.totalPending).toBe(0);
    });
  });

  describe("getPlatformSettingsAction", () => {
    itGuardsAdminAccess(
      () => getPlatformSettingsAction(),
      "Failed to get platform settings."
    );

    it("returns the platform fee", async () => {
      c.platformSettingsRepository.getPlatformFee.mockResolvedValue(5 as never);

      const res = await getPlatformSettingsAction();

      expect(res.data).toEqual({ platform_fee: 5 });
    });
  });

  describe("updatePlatformFeeAction", () => {
    itGuardsAdminAccess(
      () => updatePlatformFeeAction(5),
      "Failed to update platform fee."
    );

    it("updates the fee and audits it", async () => {
      c.platformSettingsRepository.updatePlatformFee.mockResolvedValue({
        platform_fee: "7.5",
      } as never);

      const res = await updatePlatformFeeAction(7.5);

      expect(
        c.platformSettingsRepository.updatePlatformFee
      ).toHaveBeenCalledWith(7.5);
      expect(c.adminAuditRepository.create).toHaveBeenCalledWith({
        data: {
          admin_id: ADMIN_ID,
          action: "ORDER_STATUS_OVERRIDE",
          target_type: "PLATFORM_SETTINGS",
          target_id: "default",
          details: { new_platform_fee: 7.5 },
        },
      });
      expect(res.data).toEqual({ platform_fee: 7.5 });
    });

    it("accepts a zero fee", async () => {
      c.platformSettingsRepository.updatePlatformFee.mockResolvedValue({
        platform_fee: 0,
      } as never);

      const res = await updatePlatformFeeAction(0);

      expect(res.data).toEqual({ platform_fee: 0 });
    });

    // NaN and Infinity are regression cases: they used to pass validation.
    it.each([
      ["a negative fee", -1],
      ["NaN", Number.NaN],
      ["Infinity", Number.POSITIVE_INFINITY],
      ["a string", "5" as unknown as number],
    ])("rejects %s with ValidationError", async (_name, fee) => {
      await expect(updatePlatformFeeAction(fee)).rejects.toThrow(
        ValidationError
      );
      expect(
        c.platformSettingsRepository.updatePlatformFee
      ).not.toHaveBeenCalled();
    });
  });
});
