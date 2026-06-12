"use server";

import { container } from "@/di/container";
import { InternalServerError, UnauthorizedError } from "@/lib/custom-error";
import { createLogger } from "@/lib/logger";
import { authUtils } from "@/lib/utils/auth.utils.server";
import { NotificationCategory } from "@/types/prisma.types";
import { ActionResponse, createSuccessResponse } from "@/types/response.types";
const log = createLogger("notification-actions");

export async function markAllNotificationsAsReadAction(): Promise<
  ActionResponse<{ count: number }>
> {
  try {
    const userId = await authUtils.getUserId();
    if (!userId) {
      throw new UnauthorizedError("Unauthorized: Please log in.");
    }

    const result = await container.notificationRepository.markAllAsRead(userId);

    return createSuccessResponse(result, "All notifications marked as read");
  } catch (error) {
    log.error({ err: error }, "MARK ALL NOTIFICATIONS READ ERROR:");
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

    const result =
      await container.notificationRepository.getNotificationsByCategory(
        userId,
        category,
        { limit: options.limit || 20, cursor: options.cursor }
      );

    return createSuccessResponse(
      result,
      "Notifications retrieved successfully"
    );
  } catch (error) {
    log.error({ err: error }, "GET NOTIFICATIONS BY CATEGORY ERROR:");
    throw new InternalServerError("Failed to retrieve notifications.");
  }
}
