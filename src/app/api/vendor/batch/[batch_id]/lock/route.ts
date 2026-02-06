import { NextRequest, NextResponse } from "next/server";

import { authUtils } from "@/lib/utils/auth.utils.server";
import { batchService } from "@/services/batch";
import { createSuccessResponse } from "@/types";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ batch_id: string }> }
) {
  try {
    const shopId = await authUtils.getOwnedShopId();
    if (!shopId) {
      return NextResponse.json(
        { error: "You do not own a shop" },
        { status: 403 }
      );
    }

    const { batch_id } = await params;
    await batchService.lockBatch(batch_id, shopId);

    return NextResponse.json(
      createSuccessResponse(null, "Batch locked. Orders are now in PREP MODE.")
    );
  } catch (error) {
    console.error("POST lock-batch error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to lock batch",
      },
      { status: 500 }
    );
  }
}
