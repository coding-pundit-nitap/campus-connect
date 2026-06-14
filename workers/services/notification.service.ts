import { Prisma } from "../generated/client";
import { notificationQueue } from "../lib/notification/notification-producer";

export class NotificationService {
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
}
