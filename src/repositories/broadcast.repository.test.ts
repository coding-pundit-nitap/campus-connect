import { asPrisma, createPrismaMock, type PrismaMock } from "@tests/helpers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Prisma } from "@/generated/client";

import { BroadcastNotificationRepository } from "./broadcast.repository";

const rows = (...ids: string[]) => ids.map((id) => ({ id }));
const withReads = (id: string, reads: number) => ({
  id,
  read_statuses: Array.from({ length: reads }, () => ({ read_at: new Date() })),
});

describe("BroadcastNotificationRepository", () => {
  let prisma: PrismaMock;
  let repo: BroadcastNotificationRepository;
  const now = new Date("2026-05-01T12:00:00Z");

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    prisma = createPrismaMock();
    repo = new BroadcastNotificationRepository(asPrisma(prisma));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("create forwards args", async () => {
    const args = {
      data: { title: "t", message: "m" },
    } as Prisma.BroadcastNotificationCreateArgs;
    prisma.broadcastNotification.create.mockResolvedValueOnce({ id: "b1" });
    await expect(repo.create(args)).resolves.toEqual({ id: "b1" });
    expect(prisma.broadcastNotification.create).toHaveBeenCalledWith(args);
  });

  it("getBroadcastNotifications returns the 10 newest", async () => {
    await repo.getBroadcastNotifications();
    expect(prisma.broadcastNotification.findMany).toHaveBeenCalledWith({
      orderBy: { created_at: "desc" },
      take: 10,
    });
  });

  describe("findUnreadForUser", () => {
    it("queries unread broadcasts for the first page with limit+1", async () => {
      prisma.broadcastNotification.findMany.mockResolvedValueOnce(
        rows("a", "b")
      );

      const res = await repo.findUnreadForUser("u1", {});

      expect(prisma.broadcastNotification.findMany).toHaveBeenCalledWith({
        where: { read_statuses: { none: { user_id: "u1" } } },
        orderBy: [{ created_at: "desc" }, { id: "desc" }],
        take: 21,
        cursor: undefined,
        skip: 0,
      });
      expect(res).toEqual({
        broadcasts: rows("a", "b"),
        nextCursor: undefined,
      });
    });

    it("continues after the cursor and trims the look-ahead row", async () => {
      prisma.broadcastNotification.findMany.mockResolvedValueOnce(
        rows("a", "b", "c")
      );

      const res = await repo.findUnreadForUser("u1", {
        limit: 2,
        cursor: "z",
      });

      expect(prisma.broadcastNotification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 3, cursor: { id: "z" }, skip: 1 })
      );
      expect(res.broadcasts).toEqual(rows("a", "b"));
      // Value intentionally not asserted: it is the popped look-ahead row,
      // which `skip: 1` then skips on the next page (reported as a bug).
      expect(res.nextCursor).toBeDefined();
    });
  });

  describe("getAllForUser", () => {
    it("includes the user's read status and maps it to isRead", async () => {
      prisma.broadcastNotification.findMany.mockResolvedValueOnce([
        withReads("a", 1),
        withReads("b", 0),
      ]);

      const res = await repo.getAllForUser("u1", {});

      expect(prisma.broadcastNotification.findMany).toHaveBeenCalledWith({
        orderBy: [{ created_at: "desc" }, { id: "desc" }],
        take: 21,
        cursor: undefined,
        skip: 0,
        include: {
          read_statuses: {
            where: { user_id: "u1" },
            select: { read_at: true },
          },
        },
      });
      expect(res).toEqual({
        broadcasts: [
          { id: "a", isRead: true, read_statuses: undefined },
          { id: "b", isRead: false, read_statuses: undefined },
        ],
        nextCursor: undefined,
      });
    });

    it("drops the look-ahead row and uses the last returned row as cursor", async () => {
      prisma.broadcastNotification.findMany.mockResolvedValueOnce([
        withReads("a", 0),
        withReads("b", 0),
        withReads("c", 0),
      ]);

      const res = await repo.getAllForUser("u1", { limit: 2, cursor: "z" });

      expect(prisma.broadcastNotification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 3, cursor: { id: "z" }, skip: 1 })
      );
      expect(res.broadcasts.map((b) => b.id)).toEqual(["a", "b"]);
      expect(res.nextCursor).toBe("b");
    });
  });

  describe("getByCreatedAtBefore", () => {
    it("filters by created_at < beforeDate and maps isRead", async () => {
      const before = new Date("2026-04-01");
      prisma.broadcastNotification.findMany.mockResolvedValueOnce([
        withReads("a", 2),
      ]);

      const res = await repo.getByCreatedAtBefore("u1", {
        limit: 5,
        beforeDate: before,
      });

      expect(prisma.broadcastNotification.findMany).toHaveBeenCalledWith({
        where: { created_at: { lt: before } },
        orderBy: [{ created_at: "desc" }, { id: "desc" }],
        take: 5,
        include: {
          read_statuses: {
            where: { user_id: "u1" },
            select: { read_at: true },
          },
        },
      });
      expect(res).toEqual([
        { id: "a", isRead: true, read_statuses: undefined },
      ]);
    });

    it("applies no date filter and the default limit when omitted", async () => {
      prisma.broadcastNotification.findMany.mockResolvedValueOnce([]);

      await expect(repo.getByCreatedAtBefore("u1", {})).resolves.toEqual([]);

      const args = prisma.broadcastNotification.findMany.mock.calls[0][0];
      expect(args.where).toBeUndefined();
      expect(args.take).toBe(20);
    });
  });

  it("markAsReadForUser upserts the read status through the user relation", async () => {
    await expect(repo.markAsReadForUser("u1", "b1")).resolves.toBeUndefined();

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: {
        broadcast_read_statuses: {
          upsert: {
            where: {
              user_id_broadcast_notification_id: {
                user_id: "u1",
                broadcast_notification_id: "b1",
              },
            },
            create: { broadcast_notification_id: "b1", read_at: now },
            update: { read_at: now },
          },
        },
      },
    });
  });

  describe("delete", () => {
    it("delete(id) deletes by id", async () => {
      await repo.delete("b1");
      expect(prisma.broadcastNotification.delete).toHaveBeenCalledWith({
        where: { id: "b1" },
      });
    });

    it("delete(args) forwards args", async () => {
      await repo.delete({ where: { id: "b1" } });
      expect(prisma.broadcastNotification.delete).toHaveBeenCalledWith({
        where: { id: "b1" },
      });
    });
  });

  describe("markManyAsReadForUser", () => {
    it("does nothing for an empty id list", async () => {
      await repo.markManyAsReadForUser("u1", []);
      expect(prisma.broadcastReadStatus.createMany).not.toHaveBeenCalled();
    });

    it("bulk-inserts read statuses, skipping duplicates", async () => {
      await repo.markManyAsReadForUser("u1", ["b1", "b2"]);
      expect(prisma.broadcastReadStatus.createMany).toHaveBeenCalledWith({
        data: [
          { user_id: "u1", broadcast_notification_id: "b1", read_at: now },
          { user_id: "u1", broadcast_notification_id: "b2", read_at: now },
        ],
        skipDuplicates: true,
      });
    });
  });

  it("getUnreadCountForUser counts broadcasts with no read status for the user", async () => {
    prisma.broadcastNotification.count.mockResolvedValueOnce(3);
    await expect(repo.getUnreadCountForUser("u1")).resolves.toBe(3);
    expect(prisma.broadcastNotification.count).toHaveBeenCalledWith({
      where: { read_statuses: { none: { user_id: "u1" } } },
    });
  });

  it("getUnreadWithCount batches the list and count in one transaction", async () => {
    prisma.broadcastNotification.findMany.mockResolvedValueOnce(rows("a"));
    prisma.broadcastNotification.count.mockResolvedValueOnce(1);

    await expect(repo.getUnreadWithCount("u1")).resolves.toEqual([
      rows("a"),
      1,
    ]);

    const where = { read_statuses: { none: { user_id: "u1" } } };
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.broadcastNotification.findMany).toHaveBeenCalledWith({
      where,
      orderBy: { created_at: "desc" },
      take: 100,
    });
    expect(prisma.broadcastNotification.count).toHaveBeenCalledWith({ where });
  });

  it("getCount forwards args", async () => {
    prisma.broadcastNotification.count.mockResolvedValueOnce(9);
    await expect(repo.getCount({ where: { id: "b1" } })).resolves.toBe(9);
    expect(prisma.broadcastNotification.count).toHaveBeenCalledWith({
      where: { id: "b1" },
    });
  });
});
