"use server";

import {
  AUTH_ERRORS,
  requireUserId,
  runAction,
} from "@/actions/_shared/action-helpers";
import { container } from "@/di/container";
import { createLogger } from "@/lib/logger";
import { NotificationCategory } from "@/types/prisma.types";
import { ActionResponse, createSuccessResponse } from "@/types/response.types";
const log = createLogger("notification-actions");

export async function markAllNotificationsAsReadAction(): Promise<
  ActionResponse<{ count: number }>
> {
  return runAction(
    log,
    {
      label: "MARK ALL NOTIFICATIONS READ ERROR:",
      fallback: "Failed to mark notifications as read.",
      passthrough: AUTH_ERRORS,
    },
    async () => {
      const userId = await requireUserId();
      const result =
        await container.notificationRepository.markAllAsRead(userId);
      return createSuccessResponse(result, "All notifications marked as read");
    }
  );
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
  return runAction(
    log,
    {
      label: "GET NOTIFICATIONS BY CATEGORY ERROR:",
      fallback: "Failed to retrieve notifications.",
      passthrough: AUTH_ERRORS,
    },
    async () => {
      const userId = await requireUserId();
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
    }
  );
}
