import { NextRequest } from "next/server";

import {
  ForbiddenError,
  UnauthenticatedError,
  UnauthorizedError,
} from "@/lib/custom-error";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/serializers/response-serializer";
import authUtils from "@/lib/utils/auth.utils.server";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";

const log = createLogger("vendor-announcements-api");

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const shopId = await authUtils.getOwnedShopId();
    if (!shopId) {
      return jsonResponse(createErrorResponse("Unauthorized"), 401);
    }

    const announcements = await prisma.shopAnnouncement.findMany({
      where: { shop_id: shopId },
      include: {
        product: { select: { name: true } },
      },
      orderBy: { created_at: "desc" },
    });

    const serialized = announcements.map((ann) => ({
      id: ann.id,
      title: ann.title,
      message: ann.message,
      expires_at: ann.expires_at.toISOString(),
      created_at: ann.created_at.toISOString(),
      product_name: ann.product?.name || null,
    }));

    return jsonResponse(
      createSuccessResponse(
        serialized,
        "Vendor announcements retrieved successfully"
      ),
      200
    );
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return jsonResponse(createErrorResponse("Unauthorized"), 401);
    }
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      return jsonResponse(createErrorResponse("Forbidden"), 403);
    }
    log.error({ err: error }, "GET VENDOR ANNOUNCEMENTS API ERROR:");
    return jsonResponse(
      createErrorResponse("Failed to fetch vendor announcements"),
      500
    );
  }
}
