import {
  ADMIN_ID,
  asAdmin,
  CURSOR,
  itGuardsAdminAccess,
  rows,
} from "@tests/helpers/actions-admin";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { container } from "@/di/container";
import { BadRequestError, NotFoundError } from "@/lib/custom-error";

import {
  getAllPayoutsAction,
  getPayoutStatsAction,
  updatePayoutStatusAction,
} from "./payout-actions";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers/actions-admin/mocks")).adminContainerModule()
);
vi.mock("@/lib/verify-admin", async () =>
  (await import("@tests/helpers/actions-admin/mocks")).verifyAdminModule()
);

const payouts = vi.mocked(container.payoutRepository);
const audits = vi.mocked(container.adminAuditRepository);

describe("admin payout actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asAdmin();
  });

  describe("getAllPayoutsAction", () => {
    itGuardsAdminAccess(
      () => getAllPayoutsAction({ limit: 10 }),
      "Failed to retrieve payouts."
    );

    it("returns payouts with numeric amounts and no filters", async () => {
      payouts.findMany.mockResolvedValue(
        rows(1, "p", () => ({ amount: "12.50" })) as never
      );

      const res = await getAllPayoutsAction({ limit: 10 });

      expect(payouts.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {}, take: 11, skip: 0 })
      );
      expect(res.data).toEqual({
        data: [{ id: "p-1", amount: 12.5 }],
        nextCursor: null,
        hasMore: false,
      });
    });

    it("applies status, shop, date range, search and cursor", async () => {
      payouts.findMany.mockResolvedValue(
        rows(2, "p", () => ({ amount: 1 })) as never
      );
      const start = new Date("2026-01-01");
      const end = new Date("2026-02-01");

      const res = await getAllPayoutsAction({
        limit: 1,
        cursor: CURSOR,
        status: "PAID",
        shop_id: "shop-1",
        start_date: start,
        end_date: end,
        search: "po_",
      });

      expect(payouts.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: "PAID",
            shop_id: "shop-1",
            created_at: { gte: start, lte: end },
            OR: [
              { pg_payout_id: { contains: "po_", mode: "insensitive" } },
              { shop: { name: { contains: "po_", mode: "insensitive" } } },
            ],
          },
          cursor: { id: CURSOR },
        })
      );
      expect(res.data?.nextCursor).toBe("p-1");
    });

    it("rejects invalid options with BadRequestError", async () => {
      await expect(
        getAllPayoutsAction({ limit: 10, status: "LOST" as never })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("updatePayoutStatusAction", () => {
    itGuardsAdminAccess(
      () => updatePayoutStatusAction({ payout_id: "p1", status: "PAID" }),
      "Failed to update payout status."
    );

    it("updates the payout and records an audit entry", async () => {
      payouts.findUnique.mockResolvedValue({
        id: "p1",
        pg_payout_id: "po_1",
        status: "PENDING",
      } as never);
      const updated = { id: "p1", pg_payout_id: "po_1", status: "PAID" };
      payouts.update.mockResolvedValue(updated as never);

      const res = await updatePayoutStatusAction({
        payout_id: "p1",
        status: "PAID",
      });

      expect(payouts.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "p1" },
          data: { status: "PAID" },
        })
      );
      expect(audits.create).toHaveBeenCalledWith({
        data: {
          admin_id: ADMIN_ID,
          action: "ORDER_STATUS_OVERRIDE",
          target_type: "PAYOUT",
          target_id: "p1",
          details: { previous_status: "PENDING", new_status: "PAID" },
        },
      });
      expect(res.data).toEqual(updated);
      expect(res.details).toBe("Payout status updated to PAID");
    });

    it("rejects an empty payout id with BadRequestError", async () => {
      await expect(
        updatePayoutStatusAction({ payout_id: "", status: "PAID" })
      ).rejects.toThrow(BadRequestError);
      expect(payouts.findUnique).not.toHaveBeenCalled();
    });

    it("throws NotFoundError for an unknown payout", async () => {
      payouts.findUnique.mockResolvedValue(null);

      await expect(
        updatePayoutStatusAction({ payout_id: "p1", status: "PAID" })
      ).rejects.toThrow(NotFoundError);
      expect(payouts.update).not.toHaveBeenCalled();
    });
  });

  describe("getPayoutStatsAction", () => {
    itGuardsAdminAccess(
      () => getPayoutStatsAction(),
      "Failed to retrieve payout statistics."
    );

    it("aggregates counts and amounts", async () => {
      [9, 2, 3, 3, 1].forEach((n) => payouts.count.mockResolvedValueOnce(n));
      payouts.aggregate
        .mockResolvedValueOnce({ _sum: { amount: "40.5" } } as never)
        .mockResolvedValueOnce({ _sum: { amount: 100 } } as never);

      const res = await getPayoutStatsAction();

      expect(res.data).toEqual({
        totalPayouts: 9,
        pendingPayouts: 2,
        inTransitPayouts: 3,
        paidPayouts: 3,
        failedPayouts: 1,
        totalPendingAmount: 40.5,
        totalPaidAmount: 100,
      });
    });

    it("defaults missing sums to zero", async () => {
      payouts.count.mockResolvedValue(0);
      payouts.aggregate
        .mockResolvedValueOnce({ _sum: { amount: null } } as never)
        .mockResolvedValueOnce({} as never);

      const res = await getPayoutStatsAction();

      expect(res.data?.totalPendingAmount).toBe(0);
      expect(res.data?.totalPaidAmount).toBe(0);
    });
  });
});
