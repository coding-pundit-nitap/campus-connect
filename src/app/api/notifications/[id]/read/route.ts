import { NextRequest, NextResponse } from "next/server";

import notificationService from "@/services/notification.service";
import { createErrorResponse, createSuccessResponse } from "@/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await notificationService.markNotificationAsRead(id);
    const successResponse = createSuccessResponse({
      message: "Notification marked as read",
    });
    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    console.error("Error in mark as read route:", error);
    const errorResponse = createErrorResponse(
      "Failed to mark notification as read"
    );
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
