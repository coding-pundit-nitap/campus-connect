import { NextRequest, NextResponse } from "next/server";

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
      return NextResponse.json(
        createSuccessResponse({
          enabled: false,
          cutoff_time: null,
          batch_id: null,
          minutes_remaining: null,
          is_open: false,
        })
      );
    }

    const now = new Date();
    const msRemaining = result.cutoff_time.getTime() - now.getTime();
    const minutesRemaining = Math.max(0, Math.ceil(msRemaining / 60000));

    return NextResponse.json(
      createSuccessResponse({
        enabled: true,
        cutoff_time: result.cutoff_time.toISOString(),
        batch_id: result.batch_id,
        minutes_remaining: minutesRemaining,
        is_open: result.batch_id !== null,
      })
    );
  } catch (error) {
    console.error("GET next-slot error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to get next slot",
      },
      { status: 500 }
    );
  }
}
