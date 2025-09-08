import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import shopRepository from "@/repositories/shop.repository";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const cursor = searchParams.get("cursor");

    const queryOptions = {
      include: { owner: { select: { name: true, email: true } } },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: {
        created_at: Prisma.SortOrder.desc,
      },
    };

    const shops = await shopRepository.getShops(queryOptions);

    let nextCursor: typeof cursor | null = null;
    if (shops.length > limit) {
      const lastItem = shops.pop();
      nextCursor = lastItem!.id;
    }

    const responseData = {
      data: shops,
      nextCursor,
    };
    const successResponse = createSuccessResponse(
      responseData,
      "Shops retrieved successfully"
    );
    return NextResponse.json(successResponse);
  } catch (error) {
    console.error("GET SHOPS ERROR:", error);
    const errorResponse = createErrorResponse(
      "An internal server error occurred."
    );
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
