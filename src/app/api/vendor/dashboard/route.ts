import { jsonResponse } from "@/lib/serializers/response-serializer";
import { authUtils } from "@/lib/utils/auth.utils.server";
import { batchService } from "@/services/batch";
import { createSuccessResponse } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const shopId = await authUtils.getOwnedShopId();
    if (!shopId) {
      return jsonResponse({ error: "You do not own a shop" }, 403);
    }

    const dashboard = await batchService.getVendorDashboard(shopId);

    return jsonResponse(createSuccessResponse(dashboard), 200);
  } catch (error) {
    console.error("GET vendor dashboard error:", error);
    return jsonResponse(
      {
        error:
          error instanceof Error ? error.message : "Failed to get dashboard",
      },
      500
    );
  }
}
