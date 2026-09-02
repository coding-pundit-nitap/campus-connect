import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Prisma } from "@/generated/client";
import { notificationQueue } from "@/lib/notification/notification-producer";
import type { BroadcastNotificationRepository } from "@/repositories/broadcast.repository";
import type { NotificationRepository } from "@/repositories/notification.repository";

import { NotificationService } from "./notification.service";

vi.mock("@/lib/logger", () => ({
  createLogger: vi.fn(() => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}));

vi.mock("@/lib/notification/notification-producer", () => ({
  notificationQueue: {
    add: vi.fn(),
  },
}));

describe("NotificationService", () => {
  let service: NotificationService;
  let broadcastRepo: {
    getByCreatedAtBefore: ReturnType<typeof vi.fn>;
    findUnreadForUser: ReturnType<typeof vi.fn>;
    markManyAsReadForUser: ReturnType<typeof vi.fn>;
    getUnreadWithCount: ReturnType<typeof vi.fn>;
  };
  let notificationRepo: {
    getNotificationsByUserId: ReturnType<typeof vi.fn>;
    getByCreatedAtBefore: ReturnType<typeof vi.fn>;
    markManyAsRead: ReturnType<typeof vi.fn>;
    getUnreadWithCount: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    broadcastRepo = {
      getByCreatedAtBefore: vi.fn(),
      findUnreadForUser: vi.fn(),
      markManyAsReadForUser: vi.fn(),
      getUnreadWithCount: vi.fn(),
    };

    notificationRepo = {
      getNotificationsByUserId: vi.fn(),
      getByCreatedAtBefore: vi.fn(),
      markManyAsRead: vi.fn(),
      getUnreadWithCount: vi.fn(),
    };

    service = new NotificationService(
      broadcastRepo as unknown as BroadcastNotificationRepository,
      notificationRepo as unknown as NotificationRepository
    );
  });

  describe("publishNotification", () => {
    it("should add job to notification queue", async () => {
      await service.publishNotification("user-1", {
        title: "Title",
        message: "Message",
        type: "INFO",
      } as unknown as Prisma.NotificationCreateWithoutUserInput);
      expect(notificationQueue.add).toHaveBeenCalledWith("send-notification", {
        type: "SEND_NOTIFICATION",
        payload: {
          type: "SEND_NOTIFICATION",
          user_id: "user-1",
          data: { title: "Title", message: "Message", type: "INFO" },
        },
      });
    });
  });

  describe("broadcastNotification", () => {
    it("should add job to notification queue", async () => {
      await service.broadcastNotification({
        title: "Broadcast",
        message: "Broadcast msg",
        type: "INFO",
      } as unknown as Prisma.BroadcastNotificationCreateInput);
      expect(notificationQueue.add).toHaveBeenCalledWith(
        "broadcast-notification",
        {
          type: "BROADCAST_NOTIFICATION",
          payload: {
            type: "BROADCAST_NOTIFICATION",
            data: {
              title: "Broadcast",
              message: "Broadcast msg",
              type: "INFO",
            },
          },
        }
      );
    });
  });

  describe("getUserNotifications", () => {
    it("should call repository getNotificationsByUserId", async () => {
      notificationRepo.getNotificationsByUserId.mockResolvedValue([]);
      await service.getUserNotifications("user-1", 10, "cursor-1");
      expect(notificationRepo.getNotificationsByUserId).toHaveBeenCalledWith(
        "user-1",
        { limit: 10, cursor: "cursor-1" }
      );
    });
  });

  describe("getAllNotificationsWithBroadcasts", () => {
    it("should return merged notifications and broadcasts", async () => {
      const date1 = new Date("2023-01-02T00:00:00Z");
      const date2 = new Date("2023-01-01T00:00:00Z");
      notificationRepo.getByCreatedAtBefore.mockResolvedValue([
        { id: "notif-1", created_at: date2 },
      ]);
      broadcastRepo.getByCreatedAtBefore.mockResolvedValue([
        { id: "broad-1", created_at: date1, isRead: false },
      ]);

      const result = await service.getAllNotificationsWithBroadcasts(
        "user-1",
        10
      );
      expect(result.data.length).toBe(2);
      expect(result.data[0].id).toBe("broad-1"); // date1 is newer
      expect(result.data[0].source).toBe("broadcast");
      expect(result.data[1].id).toBe("notif-1");
      expect(result.data[1].source).toBe("notification");
      expect(result.hasMore).toBe(false);
    });
  });

  describe("getPaginatedUnreadBroadcasts", () => {
    it("should call repository findUnreadForUser", async () => {
      broadcastRepo.findUnreadForUser.mockResolvedValue([]);
      await service.getPaginatedUnreadBroadcasts("user-1", 10, "cursor-1");
      expect(broadcastRepo.findUnreadForUser).toHaveBeenCalledWith("user-1", {
        limit: 10,
        cursor: "cursor-1",
      });
    });
  });

  describe("markNotificationsAsRead", () => {
    it("should call repository markManyAsRead", async () => {
      await service.markNotificationsAsRead("user-1", ["notif-1"]);
      expect(notificationRepo.markManyAsRead).toHaveBeenCalledWith("user-1", [
        "notif-1",
      ]);
    });
  });

  describe("markBroadcastsAsRead", () => {
    it("should call repository markManyAsReadForUser", async () => {
      await service.markBroadcastsAsRead("user-1", ["broad-1"]);
      expect(broadcastRepo.markManyAsReadForUser).toHaveBeenCalledWith(
        "user-1",
        ["broad-1"]
      );
    });
  });

  describe("getNotificationSummary", () => {
    it("should aggregate counts", async () => {
      notificationRepo.getUnreadWithCount.mockResolvedValue([[], 5]);
      broadcastRepo.getUnreadWithCount.mockResolvedValue([[], 3]);
      const result = await service.getNotificationSummary("user-1");
      expect(result.unreadCount.notifications).toBe(5);
      expect(result.unreadCount.broadcasts).toBe(3);
      expect(result.unreadCount.total).toBe(8);
    });
  });
});
