import { NextResponse } from "next/server";

import { authUtils } from "@/lib/utils/auth.utils.server";
import { notificationService } from "@/services/notification/notification.service";
import { createErrorResponse, createSuccessResponse } from "@/types";

export async function GET() {
  try {
    const user_id = await authUtils.getUserId();
    const summary = await notificationService.getNotificationSummary(user_id);
    return NextResponse.json(createSuccessResponse(summary));
  } catch (error) {
    console.error("Error fetching unread notifications:", error);
    return NextResponse.json(
      createErrorResponse("Failed to fetch unread notifications"),
      { status: 500 }
    );
  }
}
