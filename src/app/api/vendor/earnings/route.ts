import { NextRequest } from "next/server";

import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/serializers/response-serializer";
import authUtils from "@/lib/utils/auth.utils.server";
import {
  aggregateEarnings,
  type EarningsPeriod,
  getPeriodRange,
  type OrderMoneyRow,
} from "@/lib/utils/earnings";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";

const log = createLogger("route");

const VALID_PERIODS: EarningsPeriod[] = ["today", "week", "month"];

export async function GET(request: NextRequest) {
  try {
    const shopId = await authUtils.getOwnedShopId();

    const raw = request.nextUrl.searchParams.get("period");
    const period: EarningsPeriod = VALID_PERIODS.includes(raw as EarningsPeriod)
      ? (raw as EarningsPeriod)
      : "today";

    const { start, end } = getPeriodRange(period);

    const orders = await prisma.order.findMany({
      where: {
        shop_id: shopId,
        order_status: "COMPLETED",
        actual_delivery_time: { gte: start, lte: end },
      },
      select: {
        item_total: true,
        delivery_fee: true,
        platform_fee: true,
        total_price: true,
        payment_method: true,
      },
    });

    const rows: OrderMoneyRow[] = orders.map((o) => ({
      item_total: Number(o.item_total),
      delivery_fee: Number(o.delivery_fee),
      platform_fee: Number(o.platform_fee),
      total_price: Number(o.total_price),
      payment_method: o.payment_method,
    }));

    return jsonResponse(
      createSuccessResponse({
        period,
        periodStart: start.toISOString(),
        periodEnd: end.toISOString(),
        ...aggregateEarnings(rows),
      }),
      200
    );
  } catch (error) {
    log.error({ err: error }, "GET vendor earnings error:");
    return jsonResponse(
      createErrorResponse(
        error instanceof Error ? error.message : "Failed to load earnings"
      ),
      500
    );
  }
}
