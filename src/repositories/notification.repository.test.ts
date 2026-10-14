import { asPrisma, createPrismaMock, type PrismaMock } from "@tests/helpers";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Prisma } from "@/generated/client";

import { NotificationRepository } from "./notification.repository";

const rows = (...ids: string[]) => ids.map((id) => ({ id }));
const newestFirst = [{ created_at: "desc" }, { id: "desc" }];

describe("NotificationRepository", () => {
  let prisma: PrismaMock;
  let repo: NotificationRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = createPrismaMock();
    repo = new NotificationRepository(asPrisma(prisma));
  });

  it("create forwards args", async () => {
    const args = { data: { title: "t" } } as Prisma.NotificationCreateArgs;
    prisma.notification.create.mockResolvedValueOnce({ id: "n1" });
    await expect(repo.create(args)).resolves.toEqual({ id: "n1" });
    expect(prisma.notification.create).toHaveBeenCalledWith(args);
  });

  it("markAsRead flags one notification as read", async () => {
    prisma.notification.update.mockResolvedValueOnce({ id: "n1", read: true });
    await expect(repo.markAsRead("n1")).resolves.toEqual({
      id: "n1",
      read: true,
    });
    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: "n1" },
      data: { read: true },
    });
  });

  describe("getNotificationsByUserId", () => {
    it("returns the first page without a next cursor when it fits", async () => {
      prisma.notification.findMany.mockResolvedValueOnce(rows("a"));

      const res = await repo.getNotificationsByUserId("u1", {});

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { user_id: "u1" },
        orderBy: newestFirst,
        take: 21,
        cursor: undefined,
        skip: 0,
      });
      expect(res).toEqual({
        data: rows("a"),
        nextCursor: null,
        hasMore: false,
      });
    });

    it("continues after the cursor and reports more when over the limit", async () => {
      prisma.notification.findMany.mockResolvedValueOnce(rows("a", "b", "c"));

      const res = await repo.getNotificationsByUserId("u1", {
        limit: 2,
        cursor: "z",
      });

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 3, cursor: { id: "z" }, skip: 1 })
      );
      expect(res.data).toEqual(rows("a", "b"));
      expect(res.hasMore).toBe(true);
      // The cursor is the last row returned: the next query uses `skip: 1`,
      // so pointing at the trimmed look-ahead row would skip it.
      expect(res.nextCursor).toBe("b");
    });
  });

  describe("getByCreatedAtBefore", () => {
    it("adds a created_at < beforeDate filter when given", async () => {
      const before = new Date("2026-01-01");
      await repo.getByCreatedAtBefore("u1", { limit: 5, beforeDate: before });
      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { user_id: "u1", created_at: { lt: before } },
        orderBy: newestFirst,
        take: 5,
      });
    });

    it("scopes by user only with the default limit otherwise", async () => {
      await repo.getByCreatedAtBefore("u1", {});
      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { user_id: "u1" },
        orderBy: newestFirst,
        take: 20,
      });
    });
  });

  it.each([
    [undefined, 100],
    [5, 5],
  ])(
    "getUnreadNotificationsByUserId(limit=%s) takes %s unread rows",
    async (limit, take) => {
      await repo.getUnreadNotificationsByUserId("u1", limit);
      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { user_id: "u1", read: false },
        orderBy: { created_at: "desc" },
        take,
      });
    }
  );

  it("getUnreadWithCount batches list and count in one transaction", async () => {
    prisma.notification.findMany.mockResolvedValueOnce(rows("a"));
    prisma.notification.count.mockResolvedValueOnce(1);

    await expect(repo.getUnreadWithCount("u1")).resolves.toEqual([
      rows("a"),
      1,
    ]);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.notification.findMany).toHaveBeenCalledWith({
      where: { user_id: "u1", read: false },
      orderBy: { created_at: "desc" },
      take: 100,
    });
    expect(prisma.notification.count).toHaveBeenCalledWith({
      where: { user_id: "u1", read: false },
    });
  });

  describe("delete", () => {
    it("delete(id) deletes by id", async () => {
      await repo.delete("n1");
      expect(prisma.notification.delete).toHaveBeenCalledWith({
        where: { id: "n1" },
      });
    });

    it("delete(args) forwards args", async () => {
      await repo.delete({ where: { id: "n1" } });
      expect(prisma.notification.delete).toHaveBeenCalledWith({
        where: { id: "n1" },
      });
    });
  });

  it("deleteAllByUserId deletes every notification of the user", async () => {
    prisma.notification.deleteMany.mockResolvedValueOnce({ count: 4 });
    await expect(repo.deleteAllByUserId("u1")).resolves.toEqual({ count: 4 });
    expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
      where: { user_id: "u1" },
    });
  });

  describe("markManyAsRead", () => {
    it("short-circuits to count 0 for an empty id list", async () => {
      await expect(repo.markManyAsRead("u1", [])).resolves.toEqual({
        count: 0,
      });
      expect(prisma.notification.updateMany).not.toHaveBeenCalled();
    });

    it("only marks the given ids that belong to the user", async () => {
      prisma.notification.updateMany.mockResolvedValueOnce({ count: 2 });
      await expect(repo.markManyAsRead("u1", ["a", "b"])).resolves.toEqual({
        count: 2,
      });
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ["a", "b"] }, user_id: "u1" },
        data: { read: true },
      });
    });
  });

  it("getUnreadCountByUserId counts unread rows of the user", async () => {
    prisma.notification.count.mockResolvedValueOnce(7);
    await expect(repo.getUnreadCountByUserId("u1")).resolves.toBe(7);
    expect(prisma.notification.count).toHaveBeenCalledWith({
      where: { user_id: "u1", read: false },
    });
  });

  it("markAllAsRead marks every unread row of the user", async () => {
    await repo.markAllAsRead("u1");
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { user_id: "u1", read: false },
      data: { read: true },
    });
  });

  describe("getNotificationsByCategory", () => {
    it("filters by user and category on the first page", async () => {
      prisma.notification.findMany.mockResolvedValueOnce(rows("a"));

      const res = await repo.getNotificationsByCategory("u1", "ORDER", {});

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { user_id: "u1", category: "ORDER" },
        orderBy: newestFirst,
        take: 21,
        cursor: undefined,
        skip: 0,
      });
      expect(res).toEqual({ notifications: rows("a"), nextCursor: undefined });
    });

    it("continues after the cursor and trims the look-ahead row", async () => {
      prisma.notification.findMany.mockResolvedValueOnce(rows("a", "b"));

      const res = await repo.getNotificationsByCategory("u1", "ORDER", {
        limit: 1,
        cursor: "z",
      });

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 2, cursor: { id: "z" }, skip: 1 })
      );
      expect(res.notifications).toEqual(rows("a"));
      // The cursor is the last row returned: the next query uses `skip: 1`,
      // so pointing at the trimmed look-ahead row would skip it.
      expect(res.nextCursor).toBe("a");
    });
  });

  it("count forwards args", async () => {
    prisma.notification.count.mockResolvedValueOnce(2);
    await expect(repo.count({ where: { user_id: "u1" } })).resolves.toBe(2);
    expect(prisma.notification.count).toHaveBeenCalledWith({
      where: { user_id: "u1" },
    });
  });
});
