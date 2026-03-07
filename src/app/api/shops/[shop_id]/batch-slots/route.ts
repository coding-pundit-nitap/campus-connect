import { NextRequest } from "next/server";

import { jsonResponse } from "@/lib/serializers/response-serializer";
import { batchService } from "@/services/batch";
import { createErrorResponse, createSuccessResponse } from "@/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ shop_id: string }> }
) {
  const shopId = (await params).shop_id;

  try {
    const batchSlots = await batchService.getBatchSlotsWithAvailability(shopId);
    return jsonResponse(
      createSuccessResponse(batchSlots, "Batch slots fetched successfully"),
      200
    );
  } catch {
    return jsonResponse(
      createErrorResponse("Failed to fetch batch slots"),
      500
    );
  }
}
