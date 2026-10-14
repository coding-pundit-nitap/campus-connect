"use server";

import z from "zod";

import { container } from "@/di/container";
import { PayoutStatus, Prisma } from "@/generated/client";
import { BadRequestError, NotFoundError } from "@/lib/custom-error";
import { createLogger } from "@/lib/logger";
import {
  ActionResponse,
  createSuccessResponse,
  CursorPaginatedResponse,
} from "@/types/response.types";
import { searchSchema } from "@/validations";

import { cursorArgs, dateRange, runAdminAction, toCursorPage } from "./_shared";
const log = createLogger("payout-actions");

const PayoutStatusEnum = ["PENDING", "IN_TRANSIT", "PAID", "FAILED"] as const;

const getPayoutsSchema = searchSchema.extend({
  status: z.enum(PayoutStatusEnum).optional(),
  shop_id: z.string().optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
});

export type PayoutEntry = {
  id: string;
  amount: number;
  status: PayoutStatus;
  pg_payout_id: string;
  arrival_date: Date;
  created_at: Date;
  shop: {
    id: string;
    name: string;
  } | null;
};

/**
 * Get paginated payouts with filtering support.
 * Uses cursor-based pagination for scalability with large datasets.
 */
export async function getAllPayoutsAction(
  options: z.infer<typeof getPayoutsSchema>
): Promise<ActionResponse<CursorPaginatedResponse<PayoutEntry>>> {
  return runAdminAction(
    log,
    {
      label: "GET PAYOUTS ERROR:",
      fallback: "Failed to retrieve payouts.",
    },
    async () => {
      const parsedData = getPayoutsSchema.safeParse(options);
      if (!parsedData.success) {
        throw new BadRequestError("Invalid options");
      }

      const { limit, cursor, search, status, shop_id, start_date, end_date } =
        parsedData.data;

      const where: Prisma.PayoutWhereInput = {};

      if (status) {
        where.status = status;
      }

      if (shop_id) {
        where.shop_id = shop_id;
      }

      const createdAt = dateRange(start_date, end_date);
      if (createdAt) {
        where.created_at = createdAt;
      }

      if (search) {
        where.OR = [
          { pg_payout_id: { contains: search, mode: "insensitive" } },
          { shop: { name: { contains: search, mode: "insensitive" } } },
        ];
      }

      const payouts = await container.payoutRepository.findMany({
        where,
        ...cursorArgs(limit, cursor),
        orderBy: [{ created_at: "desc" }, { id: "desc" }],
        select: {
          id: true,
          amount: true,
          status: true,
          pg_payout_id: true,
          arrival_date: true,
          created_at: true,
          shop: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      const { data, nextCursor, hasMore } = toCursorPage(payouts, limit);

      return createSuccessResponse(
        {
          data: data.map((payout) => ({
            ...payout,
            amount: Number(payout.amount),
          })),
          nextCursor,
          hasMore,
        },
        "Payouts retrieved successfully"
      );
    }
  );
}

const updatePayoutStatusSchema = z.object({
  payout_id: z.string().min(1, "Payout ID is required"),
  status: z.enum(PayoutStatusEnum),
});

/**
 * Update payout status (admin override).
 */
export async function updatePayoutStatusAction(
  data: z.infer<typeof updatePayoutStatusSchema>
): Promise<
  ActionResponse<{
    id: string;
    pg_payout_id: string;
    status: PayoutStatus;
  }>
> {
  return runAdminAction(
    log,
    {
      label: "UPDATE PAYOUT STATUS ERROR:",
      fallback: "Failed to update payout status.",
      passthrough: [NotFoundError],
    },
    async (admin) => {
      const parsedData = updatePayoutStatusSchema.safeParse(data);
      if (!parsedData.success) {
        throw new BadRequestError(parsedData.error.message);
      }

      const { payout_id, status } = parsedData.data;

      const payout = await container.payoutRepository.findUnique({
        where: { id: payout_id },
        select: { id: true, pg_payout_id: true, status: true },
      });

      if (!payout) {
        throw new NotFoundError("Payout not found");
      }

      const updatedPayout = await container.payoutRepository.update({
        where: { id: payout_id },
        data: { status },
        select: { id: true, pg_payout_id: true, status: true },
      });

      await container.adminAuditRepository.create({
        data: {
          admin_id: admin,
          action: "ORDER_STATUS_OVERRIDE",
          target_type: "PAYOUT",
          target_id: payout_id,
          details: {
            previous_status: payout.status,
            new_status: status,
          },
        },
      });

      return createSuccessResponse(
        updatedPayout,
        `Payout status updated to ${status}`
      );
    }
  );
}

export type PayoutStats = {
  totalPayouts: number;
  pendingPayouts: number;
  inTransitPayouts: number;
  paidPayouts: number;
  failedPayouts: number;
  totalPendingAmount: number;
  totalPaidAmount: number;
};

/**
 * Get payout statistics for dashboard.
 */
export async function getPayoutStatsAction(): Promise<
  ActionResponse<PayoutStats>
> {
  return runAdminAction(
    log,
    {
      label: "GET PAYOUT STATS ERROR:",
      fallback: "Failed to retrieve payout statistics.",
    },
    async () => {
      const [
        totalPayouts,
        pendingPayouts,
        inTransitPayouts,
        paidPayouts,
        failedPayouts,
        pendingAmountResult,
        paidAmountResult,
      ] = await Promise.all([
        container.payoutRepository.count(),
        container.payoutRepository.count({ where: { status: "PENDING" } }),
        container.payoutRepository.count({ where: { status: "IN_TRANSIT" } }),
        container.payoutRepository.count({ where: { status: "PAID" } }),
        container.payoutRepository.count({ where: { status: "FAILED" } }),
        container.payoutRepository.aggregate({
          where: { status: { in: ["PENDING", "IN_TRANSIT"] } },
          _sum: { amount: true },
        }),
        container.payoutRepository.aggregate({
          where: { status: "PAID" },
          _sum: { amount: true },
        }),
      ]);

      return createSuccessResponse(
        {
          totalPayouts,
          pendingPayouts,
          inTransitPayouts,
          paidPayouts,
          failedPayouts,
          totalPendingAmount: Number(pendingAmountResult._sum?.amount ?? 0),
          totalPaidAmount: Number(paidAmountResult._sum?.amount ?? 0),
        },
        "Payout statistics retrieved successfully"
      );
    }
  );
}
