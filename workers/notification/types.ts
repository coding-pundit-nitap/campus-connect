import { Prisma } from "../generated/client/index.js";

export const NOTIFICATION_QUEUE_NAME = "notification-queue";

export interface NotificationJobData {
  type: "SEND_NOTIFICATION" | "BROADCAST_NOTIFICATION";
  payload:
    | {
        type: "SEND_NOTIFICATION";
        user_id: string;
        data: Prisma.NotificationCreateWithoutUserInput;
      }
    | {
        type: "BROADCAST_NOTIFICATION";
        data: Prisma.BroadcastNotificationCreateInput;
      };
}
