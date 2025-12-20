import { BroadcastNotification, Prisma } from "@/../prisma/generated/client";
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

  // in BroadcastNotificationRepository
  async markManyAsReadForUser(
    user_id: string,
    broadcast_ids: string[]
  ): Promise<void> {
    if (broadcast_ids.length === 0) {
      return;
    }
    await prisma.broadcastReadStatus.createMany({
      data: broadcast_ids.map((id) => ({
        user_id,
        broadcast_notification_id: id,
        read_at: new Date(),
      })),
      skipDuplicates: true,
    });
  }

  async getUnreadCountForUser(user_id: string): Promise<number> {
    return await prisma.broadcastNotification.count({
      where: {
        read_statuses: {
          none: { user_id: user_id },
        },
      },
    });
  }

  async getUnreadWithCount(user_id: string) {
    const where = { read_statuses: { none: { user_id } } };
    return prisma.$transaction([
      prisma.broadcastNotification.findMany({
        where,
        orderBy: { created_at: "desc" },
        take: 100,
      }),
      prisma.broadcastNotification.count({ where }),
    ]);
  }

  async getCount(args: Prisma.BroadcastNotificationCountArgs) {
    return prisma.broadcastNotification.count(args);
  }
}

export const broadcastRepository = new BroadcastNotificationRepository();
export default broadcastRepository;
