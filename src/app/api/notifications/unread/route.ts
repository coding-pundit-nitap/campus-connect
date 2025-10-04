import { NextResponse } from "next/server";

import { authUtils } from "@/lib/utils-functions";
import notificationService from "@/services/notification.service";
import { createErrorResponse, createSuccessResponse } from "@/types";

export async function GET() {
  try {
    const user_id = await authUtils.getUserId();

    const unreadNotifications =
      await notificationService.getUnreadNotifications(user_id);
    const unreadBroadcasts =
      await notificationService.getUnreadBroadcasts(user_id);

    return NextResponse.json(
      createSuccessResponse({ unreadNotifications, unreadBroadcasts }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching unread notifications:", error);
    return NextResponse.json(
      createErrorResponse("Failed to fetch unread notifications"),
      { status: 500 }
    );
  }
}
