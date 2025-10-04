import { BroadcastNotification, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

class BroadcastNotificationRepository {
  async create(
    data: Prisma.BroadcastNotificationCreateArgs
  ): Promise<BroadcastNotification> {
    return prisma.broadcastNotification.create(data);
  }
  async getBroadcastNotifications(): Promise<BroadcastNotification[]> {
    return prisma.broadcastNotification.findMany({
      orderBy: { created_at: "desc" },
      take: 10,
    });
  }

  async findUnreadForUser(
    user_id: string,
    { limit = 20, cursor }: { limit?: number; cursor?: string }
  ): Promise<{ broadcasts: BroadcastNotification[]; nextCursor?: string }> {
    const take = limit + 1;
    const broadcasts = await prisma.broadcastNotification.findMany({
      where: {
        read_statuses: {
          none: {
            user_id: user_id,
          },
        },
      },
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
      take,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
    });

    let nextCursor: string | undefined = undefined;
    if (broadcasts.length > limit) {
      const nextItem = broadcasts.pop();
      nextCursor = nextItem!.id;
    }

    return { broadcasts, nextCursor };
  }

  async markAsReadForUser(
    user_id: string,
    broadcast_notification_id: string
  ): Promise<void> {
    await prisma.user.update({
      where: { id: user_id },
      data: {
        broadcast_read_statuses: {
          upsert: {
            where: {
              user_id_broadcast_notification_id: {
                user_id,
                broadcast_notification_id,
              },
            },
            create: {
              broadcast_notification_id,
              read_at: new Date(),
            },
            update: {
              read_at: new Date(),
            },
          },
        },
      },
    });
  }

  async delete(
    broadcastnotification_id: string
  ): Promise<BroadcastNotification> {
    return prisma.broadcastNotification.delete({
      where: { id: broadcastnotification_id },
    });
  }
}

export const broadcastRepository = new BroadcastNotificationRepository();
export default broadcastRepository;
