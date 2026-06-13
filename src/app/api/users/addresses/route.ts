import { userAddressRepository } from "@/di/container";
import { createLogger } from "@/lib/logger";
import { jsonResponse } from "@/lib/serializers/response-serializer";
import authUtils from "@/lib/utils/auth.utils.server";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";

const log = createLogger("user-addresses-route");

export async function GET() {
  try {
    const user_id = await authUtils.getUserId();
    if (!user_id) {
      return jsonResponse(createErrorResponse("Unauthorized"), 401);
    }

    const addresses = await userAddressRepository.findByUserId(user_id);
    return jsonResponse(
      createSuccessResponse(addresses, "Addresses fetched successfully!"),
      200
    );
  } catch (error) {
    log.error({ err: error }, "GET USER ADDRESSES ERROR:");
    return jsonResponse(createErrorResponse("Internal Server Error"), 500);
  }
}
