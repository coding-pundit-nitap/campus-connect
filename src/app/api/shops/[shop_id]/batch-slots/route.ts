import { NextRequest, NextResponse } from "next/server";

import { batchService } from "@/services/batch";
import { createErrorResponse, createSuccessResponse } from "@/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ shop_id: string }> }
) {
  const shopId = (await params).shop_id;

  try {
    const batchSlots = await batchService.getBatchSlotsWithAvailability(shopId);
    return NextResponse.json(
      createSuccessResponse(batchSlots, "Batch slots fetched successfully")
    );
  } catch {
    return NextResponse.json(
      createErrorResponse("Failed to fetch batch slots"),
      { status: 500 }
    );
  }
}
