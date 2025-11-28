import { NextRequest, NextResponse } from "next/server";

import { UnauthenticatedError } from "@/lib/custom-error";
import { authUtils } from "@/lib/utils/auth.utils.server";
import { notificationService } from "@/services/notification/notification.service";
import { createErrorResponse, createSuccessResponse } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await authUtils.getUserData();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const cursor = searchParams.get("cursor") ?? undefined;

    const notifications = await notificationService.getUserNotifications(
      user.id!,
      limit,
      cursor
    );
    const successResponse = createSuccessResponse(notifications);
    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json(createErrorResponse(error.message), {
        status: 401,
      });
    }
    const errorResponse = createErrorResponse("Failed to fetch notifications");
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
