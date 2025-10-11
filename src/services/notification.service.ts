import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { redisPublisher } from "@/lib/redis";
import broadcastRepository from "@/repositories/broadcast.repository";
import { notificationRepository } from "@/repositories/notification.repository";

class NotificationService {
  async publishNotification(
    user_id: string,
    data: Prisma.NotificationCreateWithoutUserInput
  ) {
    const newNotification = await prisma.$transaction(async (tx) => {
      const createdNotification = await tx.notification.create({
        data: {
          ...data,
          user: { connect: { id: user_id } },
        },
      });

      return createdNotification;
    });

    const channel = `user:${user_id}:notifications`;
    await redisPublisher.publish(channel, JSON.stringify(newNotification));
    return newNotification;
  }

  async broadcastNotification(data: Prisma.BroadcastNotificationCreateInput) {
    const newBroadcast = await prisma.$transaction(async (tx) => {
      const createdBroadcast = await tx.broadcastNotification.create({ data });

      return createdBroadcast;
    });

    const channel = `broadcast:notifications`;
    await redisPublisher.publish(channel, JSON.stringify(newBroadcast));

    return newBroadcast;
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

  async markNotificationsAsRead(notification_ids: string[]): Promise<void> {
    await notificationRepository.markManyAsRead(notification_ids);
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
