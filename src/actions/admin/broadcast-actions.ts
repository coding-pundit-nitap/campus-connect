"use server";

import { NotificationCategory, NotificationType } from "@prisma/client";

import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  UnauthorizedError,
} from "@/lib/custom-error";
import broadcastRepository from "@/repositories/broadcast.repository";
import userRepository from "@/repositories/user.repository";
import { notificationService } from "@/services/notification";
import { ActionResponse, createSuccessResponse } from "@/types/response.types";

import { verifyAdmin } from "../authentication/admin";
export async function sendBroadcastNotificationAction(data: {
  title: string;
  message: string;
  type?: NotificationType;
  category?: NotificationCategory;
  action_url?: string;
}): Promise<
  ActionResponse<{
    id: string;
    title: string;
    message: string;
  }>
> {
  try {
    await verifyAdmin();

    if (!data.title || data.title.trim().length === 0) {
      throw new BadRequestError("Title is required");
    }

    if (!data.message || data.message.trim().length === 0) {
      throw new BadRequestError("Message is required");
    }

    if (data.title.length > 200) {
      throw new BadRequestError("Title must be less than 200 characters");
    }

    if (data.message.length > 1000) {
      throw new BadRequestError("Message must be less than 1000 characters");
    }

    const broadcast = await notificationService.broadcastNotification({
      title: data.title,
      message: data.message,
      type: data.type || NotificationType.INFO,
      category: data.category || NotificationCategory.ANNOUNCEMENT,
      action_url: data.action_url,
    });

    return createSuccessResponse(
      {
        id: broadcast.id,
        title: broadcast.title,
        message: broadcast.message,
      },
      "Broadcast notification sent successfully"
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
