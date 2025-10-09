import { NextRequest, NextResponse } from "next/server";

import { authUtils } from "@/lib/utils-functions";
import notificationService from "@/services/notification.service";
import { createErrorResponse, createSuccessResponse } from "@/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const user_id = await authUtils.getUserId();
    await notificationService.markBroadcastAsRead(user_id, id);
    const successResponse = createSuccessResponse({
      message: "Broadcast notification marked as read",
    });
    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    console.error("Error in mark broadcast as read route:", error);
    const errorResponse = createErrorResponse(
      "Failed to mark broadcast as read"
    );
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
