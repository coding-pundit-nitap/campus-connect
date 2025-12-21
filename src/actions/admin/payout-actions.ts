"use server";

import z from "zod";

import { PayoutStatus, Prisma } from "@/../prisma/generated/client";
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from "@/lib/custom-error";
import { prisma } from "@/lib/prisma";
import {
  ActionResponse,
  createSuccessResponse,
  CursorPaginatedResponse,
} from "@/types/response.types";
import { searchSchema } from "@/validations";

import { verifyAdmin } from "../authentication/admin";

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
  try {
    await verifyAdmin();

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

    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) {
        where.created_at.gte = start_date;
      }
      if (end_date) {
        where.created_at.lte = end_date;
      }
    }

    if (search) {
      where.OR = [
        { pg_payout_id: { contains: search, mode: "insensitive" } },
        { shop: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const payouts = await prisma.payout.findMany({
      where,
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { created_at: "desc" },
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

    const hasMore = payouts.length > limit;
    const data = hasMore ? payouts.slice(0, -1) : payouts;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

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
  } catch (error) {
    console.error("GET PAYOUTS ERROR:", error);
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      throw error;
    }
    throw new InternalServerError("Failed to retrieve payouts.");
  }
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
  try {
    const admin = await verifyAdmin();

    const parsedData = updatePayoutStatusSchema.safeParse(data);
    if (!parsedData.success) {
      throw new BadRequestError(parsedData.error.message);
    }

    const { payout_id, status } = parsedData.data;

    const payout = await prisma.payout.findUnique({
      where: { id: payout_id },
      select: { id: true, pg_payout_id: true, status: true },
    });

    if (!payout) {
      throw new NotFoundError("Payout not found");
    }

    const updatedPayout = await prisma.payout.update({
      where: { id: payout_id },
      data: { status },
      select: { id: true, pg_payout_id: true, status: true },
    });

    await prisma.adminAuditLog.create({
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
  } catch (error) {
    console.error("UPDATE PAYOUT STATUS ERROR:", error);
    if (
      error instanceof UnauthorizedError ||
      error instanceof ForbiddenError ||
      error instanceof NotFoundError
    ) {
      throw error;
    }
    throw new InternalServerError("Failed to update payout status.");
  }
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
  try {
    await verifyAdmin();

    const [
      totalPayouts,
      pendingPayouts,
      inTransitPayouts,
      paidPayouts,
      failedPayouts,
      pendingAmountResult,
      paidAmountResult,
    ] = await Promise.all([
      prisma.payout.count(),
      prisma.payout.count({ where: { status: "PENDING" } }),
      prisma.payout.count({ where: { status: "IN_TRANSIT" } }),
      prisma.payout.count({ where: { status: "PAID" } }),
      prisma.payout.count({ where: { status: "FAILED" } }),
      prisma.payout.aggregate({
        where: { status: { in: ["PENDING", "IN_TRANSIT"] } },
        _sum: { amount: true },
      }),
      prisma.payout.aggregate({
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
        totalPendingAmount: Number(pendingAmountResult._sum.amount ?? 0),
        totalPaidAmount: Number(paidAmountResult._sum.amount ?? 0),
      },
      "Payout statistics retrieved successfully"
    );
  } catch (error) {
    console.error("GET PAYOUT STATS ERROR:", error);
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      throw error;
    }
    throw new InternalServerError("Failed to retrieve payout statistics.");
  }
}
