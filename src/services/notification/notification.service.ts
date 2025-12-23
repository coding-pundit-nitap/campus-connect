import { Prisma } from "@/../prisma/generated/client";
import { notificationQueue } from "@/lib/notification/notification-producer";
import broadcastRepository from "@/repositories/broadcast.repository";
import { notificationRepository } from "@/repositories/notification.repository";

class NotificationService {
  async publishNotification(
    user_id: string,
    data: Prisma.NotificationCreateWithoutUserInput
  ) {
    await notificationQueue.add("send-notification", {
      type: "SEND_NOTIFICATION",
      payload: {
        type: "SEND_NOTIFICATION",
        user_id,
        data,
      },
    });
  }

  async broadcastNotification(data: Prisma.BroadcastNotificationCreateInput) {
    await notificationQueue.add("broadcast-notification", {
      type: "BROADCAST_NOTIFICATION",
      payload: {
        type: "BROADCAST_NOTIFICATION",
        data,
      },
    });
  }

  async getUserNotifications(user_id: string, limit = 20, cursor?: string) {
    return await notificationRepository.getNotificationsByUserId(user_id, {
      limit,
      cursor,
    });
  }

  async getAllNotificationsWithBroadcasts(
    user_id: string,
    limit = 20,
    cursor?: string
  ) {
    const beforeDate = cursor ? new Date(cursor) : undefined;

    const [notifications, broadcasts] = await Promise.all([
      notificationRepository.getByCreatedAtBefore(user_id, {
        limit: limit + 1,
        beforeDate,
      }),
      broadcastRepository.getByCreatedAtBefore(user_id, {
        limit: limit + 1,
        beforeDate,
      }),
    ]);

    const notificationsWithType = notifications.map((notification) => ({
      ...notification,
      source: "notification" as const,
    }));

    const broadcastsWithType = broadcasts.map((broadcast) => ({
      ...broadcast,
      source: "broadcast" as const,
      user_id: user_id,
      read: broadcast.isRead ?? false,
    }));

    const merged = [...notificationsWithType, ...broadcastsWithType].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const limited = merged.slice(0, limit);
    const hasMore = merged.length > limit;
    const nextCursor =
      hasMore && limited.length > 0
        ? new Date(limited[limited.length - 1].created_at).toISOString()
        : null;

    return {
      data: limited,
      nextCursor,
      hasMore,
    };
  }

  async getPaginatedUnreadBroadcasts(
    user_id: string,
    limit = 20,
    cursor?: string
  ) {
    return await broadcastRepository.findUnreadForUser(user_id, {
      limit,
      cursor,
    });
  }

  async markNotificationsAsRead(
    user_id: string,
    notification_ids: string[]
  ): Promise<void> {
    await notificationRepository.markManyAsRead(user_id, notification_ids);
  }

  async markBroadcastsAsRead(
    user_id: string,
    broadcast_ids: string[]
  ): Promise<void> {
    await broadcastRepository.markManyAsReadForUser(user_id, broadcast_ids);
  }

  async getNotificationSummary(user_id: string) {
    const [
      [unreadNotifications, notificationsCount],
      [unreadBroadcasts, broadcastsCount],
    ] = await Promise.all([
      notificationRepository.getUnreadWithCount(user_id),
      broadcastRepository.getUnreadWithCount(user_id),
    ]);

    return {
      unreadNotifications,
      unreadBroadcasts,
      unreadCount: {
        notifications: notificationsCount,
        broadcasts: broadcastsCount,
        total: notificationsCount + broadcastsCount,
      },
    };
  }
}

export const notificationService = new NotificationService();
export default notificationService;
