"use server";

import { InternalServerError, UnauthorizedError } from "@/lib/custom-error";
import { authUtils } from "@/lib/utils/auth.utils.server";
import { notificationRepository } from "@/repositories/notification.repository";
import { NotificationCategory } from "@/types/prisma.types";
import { ActionResponse, createSuccessResponse } from "@/types/response.types";

export async function markAllNotificationsAsReadAction(): Promise<
  ActionResponse<{ count: number }>
> {
  try {
    const userId = await authUtils.getUserId();
    if (!userId) {
      throw new UnauthorizedError("Unauthorized: Please log in.");
    }

    const result = await notificationRepository.markAllAsRead(userId);

    return createSuccessResponse(result, "All notifications marked as read");
  } catch (error) {
    console.error("MARK ALL NOTIFICATIONS READ ERROR:", error);
    throw new InternalServerError("Failed to mark notifications as read.");
  }
}

export async function getNotificationsByCategoryAction(
  category: NotificationCategory,
  options: { limit?: number; cursor?: string } = {}
): Promise<
  ActionResponse<{
    notifications: Array<{
      id: string;
      title: string;
      message: string;
      read: boolean;
      created_at: Date;
    }>;
    nextCursor?: string;
  }>
> {
  try {
    const userId = await authUtils.getUserId();
    if (!userId) {
      throw new UnauthorizedError("Unauthorized: Please log in.");
    }

    const result = await notificationRepository.getNotificationsByCategory(
      userId,
      category,
      { limit: options.limit || 20, cursor: options.cursor }
    );

    return createSuccessResponse(
      result,
      "Notifications retrieved successfully"
    );
  } catch (error) {
    console.error("GET NOTIFICATIONS BY CATEGORY ERROR:", error);
    throw new InternalServerError("Failed to retrieve notifications.");
  }
}
