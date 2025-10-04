import { NotificationType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { authUtils } from "@/lib/utils-functions";
import { notificationService } from "@/services/notification.service";
import { createErrorResponse, createSuccessResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await authUtils.isAdmin();

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      user_id,
      title,
      message,
      type = NotificationType.INFO,
      broadcast = false,
      action_url,
      category,
    } = body;

    let result;
    if (broadcast) {
      result = await notificationService.broadcastNotification({
        title,
        message,
        type,
        action_url,
        category,
      });
    } else if (user_id) {
      result = await notificationService.publishNotification(user_id, {
        title,
        message,
        type,
        action_url,
        category,
      });
    } else {
      const errorResponse = createErrorResponse(
        "user_id required for non-broadcast notifications"
      );
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const successResponse = createSuccessResponse(
      result,
      "Notification sent successfully"
    );

    return NextResponse.json(successResponse, { status: 201 });
  } catch (error) {
    console.error("Error sending notification:", error);
    const errorResponse = createErrorResponse("Failed to send notification");
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
