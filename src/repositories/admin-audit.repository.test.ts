import { asPrisma, createPrismaMock, type PrismaMock } from "@tests/helpers";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminAction, Prisma } from "@/generated/client";

import { AdminAuditRepository } from "./admin-audit.repository";

describe("AdminAuditRepository", () => {
  let prisma: PrismaMock;
  let repo: AdminAuditRepository;
  const action = Object.values(AdminAction)[0];

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = createPrismaMock();
    prisma.adminAuditLog.create.mockResolvedValue({ id: "log-1" });
    repo = new AdminAuditRepository(asPrisma(prisma));
  });

  describe("create", () => {
    it("passes Prisma create args straight through", async () => {
      const args = {
        data: {
          admin_id: "admin-1",
          action,
          target_type: "shop",
          target_id: "shop-1",
        },
      } as Prisma.AdminAuditLogCreateArgs;

      await expect(repo.create(args)).resolves.toEqual({ id: "log-1" });
      expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(args);
    });

    it("maps a flat input to create data, keeping details and request metadata", async () => {
      await repo.create({
        admin_id: "admin-1",
        action,
        target_type: "user",
        target_id: "user-1",
        details: { reason: "spam" },
        ip_address: "1.2.3.4",
        user_agent: "UA",
      });

      expect(prisma.adminAuditLog.create).toHaveBeenCalledWith({
        data: {
          admin_id: "admin-1",
          action,
          target_type: "user",
          target_id: "user-1",
          details: { reason: "spam" },
          ip_address: "1.2.3.4",
          user_agent: "UA",
        },
      });
    });

    it("stores JsonNull when details are omitted", async () => {
      await repo.create({
        admin_id: "admin-1",
        action,
        target_type: "user",
        target_id: "user-1",
      });

      const { data } = prisma.adminAuditLog.create.mock.calls[0][0];
      expect(data.details).toBe(Prisma.JsonNull);
      expect(data.ip_address).toBeUndefined();
      expect(data.user_agent).toBeUndefined();
    });
  });

  it("findByAdminId scopes by admin, newest first, with pagination", async () => {
    prisma.adminAuditLog.findMany.mockResolvedValueOnce([{ id: "log-1" }]);

    await expect(
      repo.findByAdminId("admin-1", { skip: 5, take: 10 })
    ).resolves.toEqual([{ id: "log-1" }]);
    expect(prisma.adminAuditLog.findMany).toHaveBeenCalledWith({
      where: { admin_id: "admin-1" },
      orderBy: { created_at: "desc" },
      skip: 5,
      take: 10,
    });
  });

  it("findByAdminId without options leaves pagination unset", async () => {
    await repo.findByAdminId("admin-1");
    expect(prisma.adminAuditLog.findMany).toHaveBeenCalledWith({
      where: { admin_id: "admin-1" },
      orderBy: { created_at: "desc" },
      skip: undefined,
      take: undefined,
    });
  });

  it("findByTarget scopes by target type and id, newest first", async () => {
    await repo.findByTarget("shop", "shop-1");
    expect(prisma.adminAuditLog.findMany).toHaveBeenCalledWith({
      where: { target_type: "shop", target_id: "shop-1" },
      orderBy: { created_at: "desc" },
    });
  });

  it.each([
    [undefined, 50],
    [5, 5],
  ])("findRecent(%s) takes %s newest rows", async (limit, take) => {
    await repo.findRecent(limit);
    expect(prisma.adminAuditLog.findMany).toHaveBeenCalledWith({
      orderBy: { created_at: "desc" },
      take,
    });
  });

  it("count forwards args", async () => {
    prisma.adminAuditLog.count.mockResolvedValueOnce(3);
    await expect(repo.count({ where: { admin_id: "a" } })).resolves.toBe(3);
    expect(prisma.adminAuditLog.count).toHaveBeenCalledWith({
      where: { admin_id: "a" },
    });
  });

  it("aggregate forwards args", async () => {
    prisma.adminAuditLog.aggregate.mockResolvedValueOnce({ _count: 1 });
    await expect(repo.aggregate({ _count: true })).resolves.toEqual({
      _count: 1,
    });
    expect(prisma.adminAuditLog.aggregate).toHaveBeenCalledWith({
      _count: true,
    });
  });

  it("groupBy defaults orderBy to undefined but lets args override it", async () => {
    await repo.groupBy({ by: ["action"] } as Prisma.AdminAuditLogGroupByArgs);
    expect(prisma.adminAuditLog.groupBy).toHaveBeenCalledWith({
      orderBy: undefined,
      by: ["action"],
    });
  });
});
