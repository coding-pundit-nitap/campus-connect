import { NextRequest, NextResponse } from "next/server";

import { authUtils } from "@/lib/utils/auth.utils.server";
import { batchService } from "@/services/batch";
import { createSuccessResponse } from "@/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ order_id: string }> }
) {
  try {
    const shopId = await authUtils.getOwnedShopId();
    if (!shopId) {
      return NextResponse.json(
        { error: "You do not own a shop" },
        { status: 403 }
      );
    }

    const { order_id } = await params;
    const body = await request.json();
    const { otp } = body;

    if (!otp || typeof otp !== "string" || otp.length !== 4) {
      return NextResponse.json(
        { error: "Invalid OTP format. Must be 4 digits." },
        { status: 400 }
      );
    }

    const result = await batchService.verifyOrderOtp(order_id, otp, shopId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message, success: false },
        { status: 400 }
      );
    }

    return NextResponse.json(createSuccessResponse(result.message));
  } catch (error) {
    console.error("POST verify-otp error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to verify OTP",
      },
      { status: 500 }
    );
  }
}
