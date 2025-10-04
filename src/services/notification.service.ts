import { Notification, Prisma } from "@prisma/client";

import { redisPublisher } from "@/lib/redis";
import broadcastRepository from "@/repositories/broadcast.repository";
import { notificationRepository } from "@/repositories/notification.repository";

class NotificationService {
  async publishNotification(
    user_id: string,
    data: Prisma.NotificationCreateWithoutUserInput
  ) {
    const newNotification = await notificationRepository.create({
      data: {
        ...data,
        user: { connect: { id: user_id } },
      },
    });
    const channel = `user:${user_id}:notifications`;
    await redisPublisher.publish(channel, JSON.stringify(newNotification));
    return newNotification;
  }

  async broadcastNotification(data: Prisma.BroadcastNotificationCreateInput) {
    const newBroadcast = await broadcastRepository.create({ data });

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

  async getUnreadNotifications(user_id: string) {
    return await notificationRepository.getUnreadNotificationsByUserId(user_id);
  }

  async getUnreadBroadcasts(user_id: string) {
    const { broadcasts } = await broadcastRepository.findUnreadForUser(
      user_id,
      {
        limit: 1000,
      }
    );
    return broadcasts;
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

  async markNotificationAsRead(notification_id: string): Promise<Notification> {
    return notificationRepository.markAsRead(notification_id);
  }

  async markBroadcastAsRead(
    userId: string,
    broadcast_notification_id: string
  ): Promise<void> {
    await broadcastRepository.markAsReadForUser(
      userId,
      broadcast_notification_id
    );
  }

  async getUnreadNotificationsCount(user_id: string): Promise<number> {
    const unreadNotifications =
      await notificationRepository.getUnreadNotificationsByUserId(user_id);
    return unreadNotifications.length;
  }

  async getUnreadBroadcastsCount(user_id: string): Promise<number> {
    const { broadcasts } = await broadcastRepository.findUnreadForUser(
      user_id,
      {
        limit: 1000,
      }
    );
    return broadcasts.length;
  }
}

export const notificationService = new NotificationService();
export default notificationService;
