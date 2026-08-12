import { NextRequest } from "next/server";

import { OrderStatus, PaymentStatus, Prisma } from "@/generated/client";
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
  orderWithDetailsInclude,
  serializeOrderWithDetails,
} from "@/lib/utils/order.utils";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";

const log = createLogger("route");

const MAX_PAGE_SIZE = 50;

export async function GET(request: NextRequest) {
  try {
    const shopId = await authUtils.getOwnedShopId();
    const params = request.nextUrl.searchParams;

    const page = Math.max(1, Number(params.get("page")) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Number(params.get("pageSize")) || 20)
    );
    const search = params.get("search")?.trim() || "";
    const status = params.get("status") || "";
    const paymentStatus = params.get("paymentStatus") || "";
    const from = params.get("from");
    const to = params.get("to");

    const where: Prisma.OrderWhereInput = { shop_id: shopId };

    if (status && status !== "ALL") {
      const validStatuses = Object.values(OrderStatus);
      if (validStatuses.includes(status as OrderStatus)) {
        where.order_status = status as OrderStatus;
      }
    }

    if (paymentStatus && paymentStatus !== "ALL") {
      const validPaymentStatuses = Object.values(PaymentStatus);
      if (validPaymentStatuses.includes(paymentStatus as PaymentStatus)) {
        where.payment_status = paymentStatus as PaymentStatus;
      }
    }

    const dateRange: Prisma.DateTimeFilter = {};
    if (from) {
      const fromDate = new Date(from);
      if (!Number.isNaN(fromDate.getTime())) {
        dateRange.gte = fromDate;
      }
    }
    if (to) {
      const toDate = new Date(to);
      if (!Number.isNaN(toDate.getTime())) {
        dateRange.lte = toDate;
      }
    }
    if (Object.keys(dateRange).length > 0) {
      where.created_at = dateRange;
    }

    if (search) {
      where.OR = [
        { display_id: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: orderWithDetailsInclude,
        orderBy: { created_at: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    return jsonResponse(
      createSuccessResponse({
        orders: orders.map(serializeOrderWithDetails),
        total,
        page,
        pageSize,
        hasMore: page * pageSize < total,
      }),
      200
    );
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return jsonResponse(createErrorResponse("Unauthorized"), 401);
    }
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      return jsonResponse(createErrorResponse("Forbidden"), 403);
    }
    log.error({ err: error }, "GET vendor order history error:");
    return jsonResponse(
      createErrorResponse("Failed to load order history"),
      500
    );
  }
}
