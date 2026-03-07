import { jsonResponse } from "@/lib/serializers/response-serializer";
import { formatShopData } from "@/lib/shop-utils";
import authUtils from "@/lib/utils/auth.utils.server";
import { shopRepository } from "@/repositories";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";

export async function GET() {
  try {
    const user_id = await authUtils.getUserId();
    if (!user_id) {
      return jsonResponse(createErrorResponse("User not authenticated"), 401);
    }
    const shopWithUser = await shopRepository.findByOwnerId(user_id, {
      include: { user: { select: { name: true, email: true } } },
    });

    if (!shopWithUser) {
      return jsonResponse(createSuccessResponse(null, "Shop not found"), 200);
    }

    const shop = formatShopData(shopWithUser);

    const successResponse = createSuccessResponse(
      shop,
      "Shop fetched successfully"
    );
    return jsonResponse(successResponse, 200);
  } catch (error) {
    console.error("GET SHOPS ERROR:", error);
    const errorResponse = createErrorResponse("Internal Server Error");
    return jsonResponse(errorResponse, 500);
  }
}
