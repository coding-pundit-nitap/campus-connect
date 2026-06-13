import { NextRequest } from "next/server";

import { ShopType } from "@/generated/client";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/serializers/response-serializer";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";

const log = createLogger("search-brands-api");

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type");
    const shopType =
      typeParam && typeParam !== "ALL" ? (typeParam as ShopType) : undefined;

    const rawBrands = await prisma.brand.findMany({
      where: {
        products: {
          some: {
            deleted_at: null,
            ...(shopType
              ? { shop: { shop_type: shopType, is_active: true } }
              : { shop: { is_active: true } }),
          },
        },
      },
      select: { name: true },
      orderBy: { name: "asc" },
    });

    const brands = rawBrands
      .map((p) => p.name)
      .filter((b): b is string => b !== null && b.trim().length > 0);

    return jsonResponse(
      createSuccessResponse(brands, "Brands retrieved successfully"),
      200
    );
  } catch (error) {
    log.error({ err: error }, "GET SEARCH BRANDS API ERROR:");
    return jsonResponse(createErrorResponse("Failed to fetch brands"), 500);
  }
}
