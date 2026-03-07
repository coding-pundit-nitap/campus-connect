import { NextRequest } from "next/server";
import z from "zod";

import { jsonResponse } from "@/lib/serializers/response-serializer";
import authUtils from "@/lib/utils/auth.utils.server";
import { notificationService } from "@/services/notification/notification.service";
import { createErrorResponse, createSuccessResponse } from "@/types";

const markAsReadSchema = z.object({
  notificationIds: z.cuid().array().optional(),
  broadcastIds: z.cuid().array().optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const user_id = await authUtils.getUserId();
    const body = await request.json();
    const validation = markAsReadSchema.safeParse(body);

    if (!validation.success) {
      return jsonResponse(createErrorResponse("Invalid input"), 400);
    }

    const { notificationIds, broadcastIds } = validation.data;

    if (notificationIds && notificationIds.length > 0) {
      await notificationService.markNotificationsAsRead(
        user_id,
        notificationIds
      );
    }

    if (broadcastIds && broadcastIds.length > 0) {
      await notificationService.markBroadcastsAsRead(user_id, broadcastIds);
    }

    return jsonResponse(
      createSuccessResponse(null, "Notifications marked as read"),
      200
    );
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return jsonResponse(
      createErrorResponse("Failed to mark notifications as read"),
      500
    );
  }
}
