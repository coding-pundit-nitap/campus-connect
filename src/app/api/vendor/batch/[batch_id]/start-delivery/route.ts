import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { authUtils } from "@/lib/utils/auth.utils.server";
import { batchService } from "@/services/batch";
import { createSuccessResponse } from "@/types";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ batch_id: string }> }
) {
  try {
    const shopId = await authUtils.getOwnedShopId();

    const { batch_id } = await params;

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

    await batchService.startDelivery(batch_id);

    return NextResponse.json(
      createSuccessResponse(
        "Delivery started. Orders marked as OUT_FOR_DELIVERY."
      )
    );
  } catch (error) {
    console.error("POST start-delivery error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to start delivery",
      },
      { status: 500 }
    );
  }
}
