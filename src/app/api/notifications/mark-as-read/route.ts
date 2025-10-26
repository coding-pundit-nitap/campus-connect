import { NextRequest, NextResponse } from "next/server";
import z from "zod";

import authUtils from "@/lib/utils/auth.utils";
import notificationService from "@/services/notification.service";
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
      return NextResponse.json(createErrorResponse("Invalid input"), {
        status: 400,
      });
    }

    const { notificationIds, broadcastIds } = validation.data;

    if (notificationIds && notificationIds.length > 0) {
      await notificationService.markNotificationsAsRead(notificationIds);
    }

    if (broadcastIds && broadcastIds.length > 0) {
      await notificationService.markBroadcastsAsRead(user_id, broadcastIds);
    }

    return NextResponse.json(
      createSuccessResponse(null, "Notifications marked as read"),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json(
      createErrorResponse("Failed to mark notifications as read"),
      { status: 500 }
    );
  }
}
