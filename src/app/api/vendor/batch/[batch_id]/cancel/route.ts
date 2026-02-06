import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { authUtils } from "@/lib/utils/auth.utils.server";
import { batchService } from "@/services/batch";
import { createSuccessResponse } from "@/types";

export async function POST(
  request: NextRequest,
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
    const body = await request.json();
    const { reason } = body;

    const batch = await prisma.batch.findUnique({
      where: { id: batch_id },
      select: { shop_id: true },
    });

    if (!batch || batch.shop_id !== shopId) {
      return NextResponse.json(
        { error: "Batch not found or unauthorized" },
        { status: 404 }
      );
    }

    const result = await batchService.cancelBatch(
      batch_id,
      reason || "Vendor cancelled"
    );

    return NextResponse.json(
      createSuccessResponse(
        `Batch cancelled. ${result.cancelled_orders} orders affected.`
      )
    );
  } catch (error) {
    console.error("POST cancel-batch error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to cancel batch",
      },
      { status: 500 }
    );
  }
}
