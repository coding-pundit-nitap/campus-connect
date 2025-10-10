import { NextResponse } from "next/server";

import { authUtils } from "@/lib/utils-functions/auth.utils";
import notificationService from "@/services/notification.service";
import { createErrorResponse, createSuccessResponse } from "@/types";

export async function GET() {
  try {
    const user_id = await authUtils.getUserId();

    const unreadNotificationsCount =
      await notificationService.getUnreadNotificationsCount(user_id);
    const unreadBroadcastsCount =
      await notificationService.getUnreadBroadcastsCount(user_id);

    const totalUnreadCount = unreadNotificationsCount + unreadBroadcastsCount;

    return NextResponse.json(
      createSuccessResponse({ unreadCount: totalUnreadCount }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching unread notification count:", error);
    return NextResponse.json(
      createErrorResponse("Failed to fetch unread notification count"),
      { status: 500 }
    );
  }
}
