"use server";

import z from "zod";

import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  UnauthorizedError,
} from "@/lib/custom-error";
import broadcastRepository from "@/repositories/broadcast.repository";
import userRepository from "@/repositories/user.repository";
import { auditService } from "@/services/audit";
import { notificationService } from "@/services/notification/notification.service";
import { NotificationCategory, NotificationType } from "@/types/prisma.types";
import { ActionResponse, createSuccessResponse } from "@/types/response.types";

import { verifyAdmin } from "../authentication/admin";

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
  try {
    const admin_id = await verifyAdmin();

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

    auditService.log(
      admin_id,
      "BROADCAST_CREATE",
      "BROADCAST",
      `broadcast-${Date.now()}`,
      { title: data.title, message: data.message.slice(0, 100) }
    );

    return createSuccessResponse(
      {
        id: `broadcast-${Date.now()}`,
        title: broadcastData.title,
        message: broadcastData.message,
      },
      "Broadcast notification queued successfully"
    );
  } catch (error) {
    console.error("SEND BROADCAST NOTIFICATION ERROR:", error);
    if (
      error instanceof UnauthorizedError ||
      error instanceof ForbiddenError ||
      error instanceof BadRequestError
    ) {
      throw error;
    }
    throw new InternalServerError("Failed to send broadcast notification.");
  }
}

export async function getBroadcastStatsAction(): Promise<
  ActionResponse<{
    totalBroadcasts: number;
    recentBroadcasts: number;
    totalUsers: number;
  }>
> {
  try {
    await verifyAdmin();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // get Stats Data
    const [totalUsers, totalBroadcasts, recentBroadcasts] = await Promise.all([
      userRepository.count({}),
      broadcastRepository.getCount({}),
      broadcastRepository.getCount({
        where: {
          created_at: {
            gte: thirtyDaysAgo,
          },
        },
      }),
    ]);

    return createSuccessResponse(
      {
        totalBroadcasts,
        recentBroadcasts,
        totalUsers,
      },
      "Broadcast statistics retrieved successfully"
    );
  } catch (error) {
    console.error("GET BROADCAST STATS ERROR:", error);
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      throw error;
    }
    throw new InternalServerError("Failed to retrieve broadcast statistics.");
  }
}
