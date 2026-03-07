import { NextRequest } from "next/server";
import z from "zod";

import { UnauthenticatedError } from "@/lib/custom-error";
import { jsonResponse } from "@/lib/serializers/response-serializer";
import { authUtils } from "@/lib/utils/auth.utils.server";
import { notificationService } from "@/services/notification/notification.service";
import { createErrorResponse, createSuccessResponse } from "@/types";
import { cursorPaginationSchema } from "@/validations/pagination.validation";

export async function GET(request: NextRequest) {
  try {
    const user = await authUtils.getUserData();

    const searchParams = Object.fromEntries(new URL(request.url).searchParams);
    const parsed = cursorPaginationSchema.parse(searchParams);

    const notifications =
      await notificationService.getAllNotificationsWithBroadcasts(
        user.id,
        parsed.limit,
        parsed.cursor
      );
    const successResponse = createSuccessResponse(notifications);
    return jsonResponse(successResponse, 200);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse(
        createErrorResponse(error.issues.map((e) => e.message).join(", ")),
        400
      );
    }
    console.error("Error fetching notifications:", error);
    if (error instanceof UnauthenticatedError) {
      return jsonResponse(createErrorResponse(error.message), 401);
    }
    const errorResponse = createErrorResponse("Failed to fetch notifications");
    return jsonResponse(errorResponse, 500);
  }
}
