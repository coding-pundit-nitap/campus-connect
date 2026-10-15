import { NextRequest } from "next/server";

import { internalErrorResponse } from "@/app/api/_lib/route-helpers";
import { batchRepository, shopRepository } from "@/di/container";
import { BatchStatus } from "@/generated/client";
import { createLogger } from "@/lib/logger";
import { jsonResponse } from "@/lib/serializers/response-serializer";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";

const log = createLogger("route");

export interface BatchProgressResponse {
  batchId: string | null;
  status: BatchStatus | null;
  collectiveTotal: number;
  minRequired: number | null;
  isMet: boolean;
  cutoffTime: string | null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ shop_id: string }> }
) {
  try {
    const { shop_id: shopId } = await params;

    const shop = await shopRepository.findById(shopId, {
      select: { batch_min_order_value: true },
    });
    if (!shop) {
      return jsonResponse(createErrorResponse("Shop not found"), 404);
    }

    // The shop's current batch: its OPEN batch if one exists (so a rollover
    // shows the new batch), else its latest batch still in flight
    // (PENDING_REVIEW, LOCKED, IN_TRANSIT). CANCELLED/COMPLETED never count.
    const select = {
      id: true,
      status: true,
      collective_total: true,
      min_order_value_snapshot: true,
      cutoff_time: true,
    } as const;
    const openBatch =
      (await batchRepository.findOpenBatchByShopId(shopId, { select })) ??
      (await batchRepository.findFirst({
        where: {
          shop_id: shopId,
          status: { in: ["PENDING_REVIEW", "LOCKED", "IN_TRANSIT"] },
        },
        orderBy: { cutoff_time: "desc" },
        select,
      }));

    // A batch's requirement is its snapshot, fixed at creation; the shop's
    // current setting only applies when no batch exists yet.
    const rawMin = openBatch
      ? openBatch.min_order_value_snapshot
      : shop.batch_min_order_value;
    const minRequired =
      rawMin !== null && rawMin !== undefined ? Number(rawMin) : null;
    const collectiveTotal = openBatch ? Number(openBatch.collective_total) : 0;

    const data: BatchProgressResponse = {
      batchId: openBatch?.id ?? null,
      status: openBatch?.status ?? null,
      collectiveTotal,
      minRequired,
      isMet: minRequired === null || collectiveTotal >= minRequired,
      cutoffTime: openBatch?.cutoff_time?.toISOString() ?? null,
    };

    return jsonResponse(
      createSuccessResponse(data, "Batch progress retrieved"),
      200
    );
  } catch (error) {
    log.error({ err: error }, "GET batch progress error:");
    return internalErrorResponse();
  }
}
