import { NextRequest } from "next/server";

import { MAX_PAGE_SIZE } from "@/config/constants";
import { notificationService } from "@/di/container";
import { Notification } from "@/generated/client";
import { createLogger } from "@/lib/logger";
import { jsonResponse } from "@/lib/serializers/response-serializer";
import { authUtils } from "@/lib/utils/auth.utils.server";
import {
  createErrorResponse,
  createSuccessResponse,
  CursorPaginatedResponse,
} from "@/types";
const log = createLogger("route");

export async function GET(request: NextRequest) {
  try {
    const user_id = await authUtils.getUserId();

    const { searchParams } = new URL(request.url);

    const cursor = searchParams.get("cursor") || undefined;
    const requestedLimit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!, 10)
      : 20;
    const limit = Math.min(Math.max(1, requestedLimit), MAX_PAGE_SIZE);

    const paginatedNotifications: CursorPaginatedResponse<Notification> =
      await notificationService.getUserNotifications(user_id, limit, cursor);

    return jsonResponse(createSuccessResponse(paginatedNotifications), 200);
  } catch (error) {
    log.error({ err: error }, "Error fetching notifications:");
    const errorResponse = createErrorResponse("Failed to fetch notifications");
    return jsonResponse(errorResponse, 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user_id = await authUtils.getUserId();
    const { notification_ids, broadcast_notification_ids } =
      await request.json();

    if (notification_ids && notification_ids.length > 0) {
      await notificationService.markNotificationsAsRead(
        user_id,
        notification_ids
      );
    }

    if (broadcast_notification_ids && broadcast_notification_ids.length > 0) {
      await notificationService.markBroadcastsAsRead(
        user_id,
        broadcast_notification_ids
      );
    }

    return jsonResponse(
      createSuccessResponse(null, "Notifications marked as read"),
      200
    );
  } catch (error) {
    log.error({ err: error }, "Error marking notifications as read:");
    return jsonResponse(
      createErrorResponse("Failed to mark notifications as read"),
      500
    );
  }
}
