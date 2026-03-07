import { jsonResponse } from "@/lib/serializers/response-serializer";
import { authUtils } from "@/lib/utils/auth.utils.server";
import { notificationService } from "@/services/notification/notification.service";
import { createErrorResponse, createSuccessResponse } from "@/types";

export async function GET() {
  try {
    const user_id = await authUtils.getUserId();
    const summary = await notificationService.getNotificationSummary(user_id);
    return jsonResponse(createSuccessResponse(summary), 200);
  } catch (error) {
    console.error("Error fetching unread notifications:", error);
    return jsonResponse(
      createErrorResponse("Failed to fetch unread notifications"),
      500
    );
  }
}
