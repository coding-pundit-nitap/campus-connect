import { mockOf } from "@tests/helpers";
import { beforeEach, describe, expect, it, type Mocked, vi } from "vitest";

import type { Prisma } from "@/generated/client";
import { notificationQueue } from "@/lib/notification/notification-producer";
import type { BroadcastNotificationRepository } from "@/repositories/broadcast.repository";
import type { NotificationRepository } from "@/repositories/notification.repository";

import { NotificationService } from "./notification.service";

vi.mock("@/lib/notification/notification-producer", () => ({
  notificationQueue: { add: vi.fn() },
}));

const at = (iso: string) => new Date(iso);

describe("NotificationService", () => {
  let service: NotificationService;
  let broadcastRepo: Mocked<BroadcastNotificationRepository>;
  let notificationRepo: Mocked<NotificationRepository>;

  beforeEach(() => {
    vi.clearAllMocks();
    broadcastRepo = mockOf<BroadcastNotificationRepository>();
    notificationRepo = mockOf<NotificationRepository>();
    service = new NotificationService(broadcastRepo, notificationRepo);
  });

  it("publishNotification enqueues a SEND_NOTIFICATION job", async () => {
    const data = {
      title: "Title",
      message: "Message",
      type: "INFO",
    } as Prisma.NotificationCreateWithoutUserInput;

    await service.publishNotification("user-1", data);

    expect(notificationQueue.add).toHaveBeenCalledWith("send-notification", {
      type: "SEND_NOTIFICATION",
      payload: { type: "SEND_NOTIFICATION", user_id: "user-1", data },
    });
  });

  it("broadcastNotification enqueues a BROADCAST_NOTIFICATION job", async () => {
    const data = {
      title: "Broadcast",
      message: "Broadcast msg",
      type: "INFO",
    } as Prisma.BroadcastNotificationCreateInput;

    await service.broadcastNotification(data);

    expect(notificationQueue.add).toHaveBeenCalledWith(
      "broadcast-notification",
      {
        type: "BROADCAST_NOTIFICATION",
        payload: { type: "BROADCAST_NOTIFICATION", data },
      }
    );
  });

  it.each<[[number?, string?], object]>([
    [[10, "cursor-1"], { limit: 10, cursor: "cursor-1" }],
    [[], { limit: 20, cursor: undefined }],
  ])("getUserNotifications(%j) queries %j", async (args, expected) => {
    notificationRepo.getNotificationsByUserId.mockResolvedValue([] as never);

    await service.getUserNotifications("user-1", ...args);

    expect(notificationRepo.getNotificationsByUserId).toHaveBeenCalledWith(
      "user-1",
      expected
    );
  });

  it.each<[[number?, string?], object]>([
    [[10, "cursor-1"], { limit: 10, cursor: "cursor-1" }],
    [[], { limit: 20, cursor: undefined }],
  ])("getPaginatedUnreadBroadcasts(%j) queries %j", async (args, expected) => {
    broadcastRepo.findUnreadForUser.mockResolvedValue([] as never);

    await service.getPaginatedUnreadBroadcasts("user-1", ...args);

    expect(broadcastRepo.findUnreadForUser).toHaveBeenCalledWith(
      "user-1",
      expected
    );
  });

  describe("getAllNotificationsWithBroadcasts", () => {
    it("merges both sources newest first", async () => {
      notificationRepo.getByCreatedAtBefore.mockResolvedValue([
        { id: "notif-1", created_at: at("2023-01-01T00:00:00Z") },
      ] as never);
      broadcastRepo.getByCreatedAtBefore.mockResolvedValue([
        { id: "broad-1", created_at: at("2023-01-02T00:00:00Z"), isRead: true },
        { id: "broad-2", created_at: at("2022-12-31T00:00:00Z") },
      ] as never);

      const result = await service.getAllNotificationsWithBroadcasts("user-1");

      expect(result.data.map((n) => [n.id, n.source])).toEqual([
        ["broad-1", "broadcast"],
        ["notif-1", "notification"],
        ["broad-2", "broadcast"],
      ]);
      expect(result.data[0]).toMatchObject({ user_id: "user-1", read: true });
      expect(result.data[2]).toMatchObject({ read: false });
      expect(result).toMatchObject({ hasMore: false, nextCursor: null });
      expect(notificationRepo.getByCreatedAtBefore).toHaveBeenCalledWith(
        "user-1",
        { limit: 21, beforeDate: undefined }
      );
    });

    it("truncates to the limit and returns the last item's timestamp as cursor", async () => {
      notificationRepo.getByCreatedAtBefore.mockResolvedValue([
        { id: "n1", created_at: at("2023-01-03T00:00:00Z") },
        { id: "n2", created_at: at("2023-01-02T00:00:00Z") },
      ] as never);
      broadcastRepo.getByCreatedAtBefore.mockResolvedValue([
        { id: "b1", created_at: at("2023-01-01T00:00:00Z"), isRead: false },
      ] as never);

      const result = await service.getAllNotificationsWithBroadcasts(
        "user-1",
        2,
        "2023-02-01T00:00:00.000Z"
      );

      expect(result.data.map((n) => n.id)).toEqual(["n1", "n2"]);
      expect(result).toMatchObject({
        hasMore: true,
        nextCursor: "2023-01-02T00:00:00.000Z",
      });
      expect(broadcastRepo.getByCreatedAtBefore).toHaveBeenCalledWith(
        "user-1",
        { limit: 3, beforeDate: at("2023-02-01T00:00:00.000Z") }
      );
    });

    it("returns no cursor when a zero limit yields an empty page", async () => {
      notificationRepo.getByCreatedAtBefore.mockResolvedValue([
        { id: "n1", created_at: at("2023-01-03T00:00:00Z") },
      ] as never);
      broadcastRepo.getByCreatedAtBefore.mockResolvedValue([] as never);

      const result = await service.getAllNotificationsWithBroadcasts(
        "user-1",
        0
      );

      expect(result).toEqual({ data: [], hasMore: true, nextCursor: null });
    });
  });

  it("markNotificationsAsRead delegates to the repository", async () => {
    await service.markNotificationsAsRead("user-1", ["notif-1"]);

    expect(notificationRepo.markManyAsRead).toHaveBeenCalledWith("user-1", [
      "notif-1",
    ]);
  });

  it("markBroadcastsAsRead delegates to the repository", async () => {
    await service.markBroadcastsAsRead("user-1", ["broad-1"]);

    expect(broadcastRepo.markManyAsReadForUser).toHaveBeenCalledWith("user-1", [
      "broad-1",
    ]);
  });

  it("getNotificationSummary aggregates unread items and counts", async () => {
    notificationRepo.getUnreadWithCount.mockResolvedValue([
      [{ id: "n" }],
      5,
    ] as never);
    broadcastRepo.getUnreadWithCount.mockResolvedValue([
      [{ id: "b" }],
      3,
    ] as never);

    await expect(service.getNotificationSummary("user-1")).resolves.toEqual({
      unreadNotifications: [{ id: "n" }],
      unreadBroadcasts: [{ id: "b" }],
      unreadCount: { notifications: 5, broadcasts: 3, total: 8 },
    });
  });
});
