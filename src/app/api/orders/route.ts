import { NextRequest, NextResponse } from "next/server";
import { OrderStatus } from "prisma/generated/client";
import z from "zod";

import { paginateCursor } from "@/lib/paginate";
import authUtils from "@/lib/utils/auth.utils.server";
import {
  orderWithDetailsInclude,
  serializeOrderWithDetails,
} from "@/lib/utils/order.utils";
import orderRepository from "@/repositories/order.repository";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";
import {
  cursorPaginationSchema,
  dateRangeSchema,
  parseDate,
} from "@/validations/pagination.validation";

const orderQuerySchema = cursorPaginationSchema
  .extend(dateRangeSchema.shape)
  .extend({
    status: z.enum(Object.values(OrderStatus)).optional(),
  });

export async function GET(request: NextRequest) {
  try {
    const user_id = await authUtils.getUserId();

    const params = Object.fromEntries(new URL(request.url).searchParams);

    const parsed = orderQuerySchema.parse(params);

    const dateFrom = parseDate(parsed.date_from);
    const dateTo = parseDate(parsed.date_to);

    const result = await paginateCursor(
      ({ take, cursor }) =>
        orderRepository.getOrdersByUserId(user_id, {
          take,
          cursor: cursor ? { id: cursor } : undefined,
          skip: cursor ? 1 : 0,
          orderBy: { id: "desc" },
          where: {
            order_status: parsed.status,
            created_at:
              dateFrom || dateTo ? { gte: dateFrom, lte: dateTo } : undefined,
          },
          include: orderWithDetailsInclude,
        }),
      parsed.limit,
      parsed.cursor
    );
    const successResponse = createSuccessResponse(
      {
        ...result,
        data: result.data.map(serializeOrderWithDetails),
      },
      "Orders retrieved successfully"
    );
    return NextResponse.json(successResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createErrorResponse(error.issues.map((e) => e.message).join(", ")),
        { status: 400 }
      );
    }
    console.error("GET ORDERS ERROR:", error);
    const errorResponse = createErrorResponse("Failed to fetch orders");
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
