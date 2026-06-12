import { notificationService } from "@/di/container";
import { createLogger } from "@/lib/logger";
import { jsonResponse } from "@/lib/serializers/response-serializer";
import { authUtils } from "@/lib/utils/auth.utils.server";
import { createErrorResponse, createSuccessResponse } from "@/types";
const log = createLogger("route");

export async function GET() {
  try {
    const user_id = await authUtils.getUserId();
    const summary = await notificationService.getNotificationSummary(user_id);
    return jsonResponse(createSuccessResponse(summary), 200);
  } catch (error) {
    log.error({ err: error }, "Error fetching unread notifications:");
    return jsonResponse(
      createErrorResponse("Failed to fetch unread notifications"),
      500
    );
  }
}
