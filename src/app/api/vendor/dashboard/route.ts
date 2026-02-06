import { NextResponse } from "next/server";

import { authUtils } from "@/lib/utils/auth.utils.server";
import { batchService } from "@/services/batch";
import { createSuccessResponse } from "@/types";

export async function GET() {
  try {
    const shopId = await authUtils.getOwnedShopId();
    if (!shopId) {
      return NextResponse.json(
        { error: "You do not own a shop" },
        { status: 403 }
      );
    }

    const dashboard = await batchService.getVendorDashboard(shopId);

    return NextResponse.json(createSuccessResponse(dashboard));
  } catch (error) {
    console.error("GET vendor dashboard error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to get dashboard",
      },
      { status: 500 }
    );
  }
}
