import { Notification, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

class NotificationRepository {
  async create(data: Prisma.NotificationCreateArgs): Promise<Notification> {
    return prisma.notification.create(data);
  }
  async markAsRead(notification_id: string): Promise<Notification> {
    return await prisma.notification.update({
      where: { id: notification_id },
      data: { read: true },
    });
  }
  async getNotificationsByUserId(
    user_id: string,
    { limit = 20, cursor }: { limit?: number; cursor?: string }
  ): Promise<{ notifications: Notification[]; nextCursor?: string }> {
    const take = limit + 1;
    const notifications = await prisma.notification.findMany({
      where: { user_id },
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
      take,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
    });

    let nextCursor: string | undefined = undefined;
    if (notifications.length > limit) {
      const nextItem = notifications.pop();
      nextCursor = nextItem!.id;
    }

    return { notifications, nextCursor };
  }
  async getUnreadNotificationsByUserId(
    user_id: string
  ): Promise<Notification[]> {
    return await prisma.notification.findMany({
      where: { user_id, read: false },
      orderBy: { created_at: "desc" },
    });
  }

  async getUnreadWithCount(user_id: string) {
    return prisma.$transaction([
      prisma.notification.findMany({
        where: { user_id, read: false },
        orderBy: { created_at: "desc" },
        take: 100,
      }),
      prisma.notification.count({ where: { user_id, read: false } }),
    ]);
  }

  async delete(notification_id: string): Promise<Notification> {
    return await prisma.notification.delete({ where: { id: notification_id } });
  }

  async deleteAllByUserId(user_id: string): Promise<{ count: number }> {
    return await prisma.notification.deleteMany({ where: { user_id } });
  }

  async markManyAsRead(notification_ids: string[]): Promise<{ count: number }> {
    if (notification_ids.length === 0) {
      return { count: 0 };
    }
    return await prisma.notification.updateMany({
      where: {
        id: { in: notification_ids },
      },
      data: { read: true },
    });
  }

  async getUnreadCountByUserId(user_id: string): Promise<number> {
    return await prisma.notification.count({
      where: { user_id, read: false },
    });
  }
}

export const notificationRepository = new NotificationRepository();
export default NotificationRepository;
