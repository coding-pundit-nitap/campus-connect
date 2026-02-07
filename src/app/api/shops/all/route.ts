import { NextResponse } from "next/server";
import z from "zod";

import { Prisma } from "@/generated/client";
import { paginateCursor } from "@/lib/paginate";
import { formatShopData } from "@/lib/shop-utils";
import shopRepository from "@/repositories/shop.repository";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";
import { cursorPaginationSchema } from "@/validations/pagination.validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const searchParams = Object.fromEntries(new URL(request.url).searchParams);
    const parsed = cursorPaginationSchema.parse(searchParams);

    const result = await paginateCursor(
      ({ take, cursor }) =>
        shopRepository.getShops({
          where: { is_active: true },
          include: { user: { select: { name: true, email: true } } },
          take,
          cursor: cursor ? { id: cursor } : undefined,
          skip: cursor ? 1 : 0,
          orderBy: {
            created_at: Prisma.SortOrder.desc,
          },
        }),
      parsed.limit,
      parsed.cursor
    );

    const formattedResult = {
      ...result,
      data: result.data.map(formatShopData),
    };

    const successResponse = createSuccessResponse(
      formattedResult,
      "Shops retrieved successfully"
    );
    return NextResponse.json(successResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createErrorResponse(error.issues.map((e) => e.message).join(", ")),
        { status: 400 }
      );
    }
    console.error("GET SHOPS ERROR:", error);
    const errorResponse = createErrorResponse(
      "An internal server error occurred."
    );
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
