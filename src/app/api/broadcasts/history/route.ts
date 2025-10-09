import { NextRequest, NextResponse } from "next/server";

import { UnauthenticatedError } from "@/lib/custom-error";
import { authUtils } from "@/lib/utils-functions";
import { notificationService } from "@/services/notification.service";
import { createErrorResponse, createSuccessResponse } from "@/types";
import { getBroadcastsSchema } from "@/validations/broadcast";

export async function GET(request: NextRequest) {
  try {
    const user = await authUtils.getUserData();

    const { searchParams } = new URL(request.url);
    const { limit, cursor } = getBroadcastsSchema.parse({
      limit: searchParams.get("limit"),
      cursor: searchParams.get("cursor"),
    });

    const broadcasts = await notificationService.getPaginatedUnreadBroadcasts(
      user.id!,
      limit,
      cursor
    );
    const successResponse = createSuccessResponse(broadcasts);
    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    console.error("Error fetching broadcast notifications:", error);
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json(createErrorResponse(error.message), {
        status: 401,
      });
    }
    const errorResponse = createErrorResponse(
      "Failed to fetch broadcast notifications"
    );
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
