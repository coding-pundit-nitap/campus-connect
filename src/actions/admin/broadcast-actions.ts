"use server";

import z from "zod";

import { auditService, container, notificationService } from "@/di/container";
import { BadRequestError } from "@/lib/custom-error";
import { createLogger } from "@/lib/logger";
import { NotificationCategory, NotificationType } from "@/types/prisma.types";
import { ActionResponse, createSuccessResponse } from "@/types/response.types";

import { runAdminAction } from "./_shared";
const log = createLogger("broadcast-actions");

const sendBroadcastNotificationSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  message: z
    .string()
    .min(1, "Message is required")
    .max(1000, "Message must be less than 1000 characters"),
  type: z.enum(NotificationType).optional(),
  category: z.enum(NotificationCategory).optional(),
  action_url: z.string().optional(),
});

export async function sendBroadcastNotificationAction(
  data: z.infer<typeof sendBroadcastNotificationSchema>
): Promise<
  ActionResponse<{
    id: string;
    title: string;
    message: string;
  }>
> {
  return runAdminAction(
    log,
    {
      label: "SEND BROADCAST NOTIFICATION ERROR:",
      fallback: "Failed to send broadcast notification.",
    },
    async (admin_id) => {
      const parsedData = sendBroadcastNotificationSchema.safeParse(data);

      if (!parsedData.success) {
        throw new BadRequestError(parsedData.error.message);
      }

      // send broadcast notification
      const broadcastData = {
        title: data.title,
        message: data.message,
        type: data.type || NotificationType.INFO,
        category: data.category || NotificationCategory.ANNOUNCEMENT,
        action_url: data.action_url,
      };

      await notificationService.broadcastNotification(broadcastData);

      // One id for both the audit entry and the response.
      const broadcastId = `broadcast-${Date.now()}`;

      auditService.log(admin_id, "BROADCAST_CREATE", "BROADCAST", broadcastId, {
        title: data.title,
        message: data.message.slice(0, 100),
      });

      return createSuccessResponse(
        {
          id: broadcastId,
          title: broadcastData.title,
          message: broadcastData.message,
        },
        "Broadcast notification queued successfully"
      );
    }
  );
}

export async function getBroadcastStatsAction(): Promise<
  ActionResponse<{
    totalBroadcasts: number;
    recentBroadcasts: number;
    totalUsers: number;
  }>
> {
  return runAdminAction(
    log,
    {
      label: "GET BROADCAST STATS ERROR:",
      fallback: "Failed to retrieve broadcast statistics.",
    },
    async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // get Stats Data
      const [totalUsers, totalBroadcasts, recentBroadcasts] = await Promise.all(
        [
          container.userRepository.count({}),
          container.broadcastRepository.getCount({}),
          container.broadcastRepository.getCount({
            where: {
              created_at: {
                gte: thirtyDaysAgo,
              },
            },
          }),
        ]
      );

      return createSuccessResponse(
        {
          totalBroadcasts,
          recentBroadcasts,
          totalUsers,
        },
        "Broadcast statistics retrieved successfully"
      );
    }
  );
}
