import { Prisma } from "@prisma/client";

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
