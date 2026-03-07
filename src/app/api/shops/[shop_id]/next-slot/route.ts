import { NextRequest } from "next/server";

import { jsonResponse } from "@/lib/serializers/response-serializer";
import { batchService } from "@/services/batch";
import { createSuccessResponse } from "@/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ shop_id: string }> }
) {
  try {
    const { shop_id } = await params;
    const result = await batchService.getNextSlot(shop_id);

    if (!result.enabled) {
      return jsonResponse(
        createSuccessResponse({
          enabled: false,
          cutoff_time: null,
          batch_id: null,
          minutes_remaining: null,
          is_open: false,
        }),
        200
      );
    }

    const now = new Date();
    const msRemaining = result.cutoff_time.getTime() - now.getTime();
    const minutesRemaining = Math.max(0, Math.ceil(msRemaining / 60000));

    return jsonResponse(
      createSuccessResponse({
        enabled: true,
        cutoff_time: result.cutoff_time.toISOString(),
        batch_id: result.batch_id,
        minutes_remaining: minutesRemaining,
        is_open: result.batch_id !== null,
      }),
      200
    );
  } catch (error) {
    console.error("GET next-slot error:", error);
    return jsonResponse(
      {
        error:
          error instanceof Error ? error.message : "Failed to get next slot",
      },
      500
    );
  }
}
