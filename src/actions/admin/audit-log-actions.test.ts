import {
  asAdmin,
  CURSOR,
  itGuardsAdminAccess,
} from "@tests/helpers/actions-admin";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { container } from "@/di/container";
import { BadRequestError } from "@/lib/custom-error";

import {
  getAuditLogsAction,
  getAuditLogStatsAction,
  getRecentAuditLogsAction,
} from "./audit-log-actions";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers/actions-admin/mocks")).adminContainerModule()
);
vi.mock("@/lib/verify-admin", async () =>
  (await import("@tests/helpers/actions-admin/mocks")).verifyAdminModule()
);

const audits = vi.mocked(container.adminAuditRepository);
const users = vi.mocked(container.userRepository);

const logRow = (id: string, admin_id: string) => ({
  id,
  admin_id,
  action: "USER_DELETE",
  target_type: "USER",
  target_id: "t1",
  details: null,
  ip_address: null,
  user_agent: null,
  created_at: new Date("2026-01-01"),
});

describe("admin audit log actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asAdmin();
  });

  describe("getAuditLogsAction", () => {
    itGuardsAdminAccess(
      () => getAuditLogsAction({ limit: 10 }),
      "Failed to retrieve audit logs."
    );

    it("enriches logs with admin info and handles unknown admins", async () => {
      audits.findMany.mockResolvedValue([
        logRow("l1", "a1"),
        logRow("l2", "a1"),
        logRow("l3", "gone"),
      ] as never);
      users.findMany.mockResolvedValue([
        { id: "a1", email: "a@x.io", name: "Ann" },
      ] as never);

      const res = await getAuditLogsAction({ limit: 10 });

      expect(audits.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {}, take: 11, skip: 0 })
      );
      expect(users.findMany).toHaveBeenCalledWith({
        where: { id: { in: ["a1", "gone"] } },
        select: { id: true, email: true, name: true },
      });
      expect(res.data?.data.map((l) => [l.admin_email, l.admin_name])).toEqual([
        ["a@x.io", "Ann"],
        ["a@x.io", "Ann"],
        [null, null],
      ]);
      expect(res.data?.hasMore).toBe(false);
    });

    it("applies every filter and paginates", async () => {
      audits.findMany.mockResolvedValue([
        logRow("l1", "a1"),
        logRow("l2", "a1"),
      ] as never);
      users.findMany.mockResolvedValue([] as never);
      const start = new Date("2026-01-01");
      const end = new Date("2026-02-01");

      const res = await getAuditLogsAction({
        limit: 1,
        cursor: CURSOR,
        action: "SHOP_VERIFY",
        admin_id: "a1",
        target_type: "SHOP",
        target_id: "s1",
        start_date: start,
        end_date: end,
        search: "abc",
      });

      expect(audits.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            action: "SHOP_VERIFY",
            admin_id: "a1",
            target_type: "SHOP",
            target_id: "s1",
            created_at: { gte: start, lte: end },
            OR: [
              { target_id: { contains: "abc", mode: "insensitive" } },
              { admin_id: { contains: "abc", mode: "insensitive" } },
            ],
          },
          skip: 1,
          cursor: { id: CURSOR },
        })
      );
      expect(res.data?.data).toHaveLength(1);
      expect(res.data?.nextCursor).toBe("l1");
    });

    it("rejects an unknown action with BadRequestError", async () => {
      await expect(
        getAuditLogsAction({ limit: 10, action: "NOPE" as never })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("getAuditLogStatsAction", () => {
    itGuardsAdminAccess(
      () => getAuditLogStatsAction(),
      "Failed to retrieve audit log statistics."
    );

    it("aggregates totals, action counts and top admins", async () => {
      audits.count.mockResolvedValueOnce(100).mockResolvedValueOnce(4);
      audits.groupBy
        .mockResolvedValueOnce([
          { action: "SHOP_VERIFY", _count: { action: 3 } },
          { action: "USER_DELETE", _count: undefined },
        ] as never)
        .mockResolvedValueOnce([
          { admin_id: "a1", _count: { admin_id: 7 } },
          { admin_id: "gone", _count: {} },
        ] as never);
      users.findMany.mockResolvedValue([{ id: "a1", name: "Ann" }] as never);

      const res = await getAuditLogStatsAction();

      expect(users.findMany).toHaveBeenCalledWith({
        where: { id: { in: ["a1", "gone"] } },
        select: { id: true, name: true },
      });
      expect(res.data).toEqual({
        totalLogs: 100,
        todayLogs: 4,
        recentActionCounts: [
          { action: "SHOP_VERIFY", count: 3 },
          { action: "USER_DELETE", count: 0 },
        ],
        topAdmins: [
          { admin_id: "a1", admin_name: "Ann", count: 7 },
          { admin_id: "gone", admin_name: null, count: 0 },
        ],
      });
    });
  });

  describe("getRecentAuditLogsAction", () => {
    itGuardsAdminAccess(
      () => getRecentAuditLogsAction(),
      "Failed to retrieve recent audit logs."
    );

    it.each([
      ["the default", undefined, 10],
      ["a too-small limit", 0, 1],
      ["a too-large limit", 500, 50],
      ["an in-range limit", 25, 25],
    ])("clamps %s to %s", async (_name, limit, expected) => {
      audits.findMany.mockResolvedValue([] as never);
      users.findMany.mockResolvedValue([] as never);

      await getRecentAuditLogsAction(limit);

      expect(audits.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: expected })
      );
    });

    it("returns enriched logs", async () => {
      audits.findMany.mockResolvedValue([logRow("l1", "a1")] as never);
      users.findMany.mockResolvedValue([
        { id: "a1", email: "a@x.io", name: "Ann" },
      ] as never);

      const res = await getRecentAuditLogsAction(5);

      expect(res.data).toEqual([
        { ...logRow("l1", "a1"), admin_email: "a@x.io", admin_name: "Ann" },
      ]);
    });
  });
});
