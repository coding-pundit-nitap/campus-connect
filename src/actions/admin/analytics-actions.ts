"use server";

import {
  ForbiddenError,
  InternalServerError,
  UnauthorizedError,
} from "@/lib/custom-error";
import { ActionResponse, createSuccessResponse } from "@/types/response.types";

import { verifyAdmin } from "../authentication/admin";
import { getOrderStatsAction } from "./order-actions";
import { getShopStatsAction } from "./shop-actions";
import { getUserStatsAction } from "./user-actions";

export async function getDashboardAnalyticsAction(): Promise<
  ActionResponse<{
    users: {
      totalUsers: number;
      totalAdmins: number;
      totalRegularUsers: number;
      recentUsers: number;
      activeUsers: number;
      inactiveUsers: number;
    };
    shops: {
      totalShops: number;
      activeShops: number;
      inactiveShops: number;
      verifiedShops: number;
      pendingVerification: number;
      recentShops: number;
    };
    orders: {
      totalOrders: number;
      newOrders: number;
      preparingOrders: number;
      completedOrders: number;
      cancelledOrders: number;
      pendingPayments: number;
      recentOrders: number;
      todayRevenue: number;
    };
  }>
> {
  try {
    await verifyAdmin();

    // get all stats for admin dashboard
    const [userStatsResponse, shopStatsResponse, orderStatsResponse] =
      await Promise.all([
        getUserStatsAction(),
        getShopStatsAction(),
        getOrderStatsAction(),
      ]);

    if (!userStatsResponse.success) {
      throw new InternalServerError("Failed to retrieve user statistics");
    }

    if (!shopStatsResponse.success) {
      throw new InternalServerError("Failed to retrieve shop statistics");
    }

    if (!orderStatsResponse.success) {
      throw new InternalServerError("Failed to retrieve order statistics");
    }

    return createSuccessResponse(
      {
        users: userStatsResponse.data,
        shops: shopStatsResponse.data,
        orders: orderStatsResponse.data,
      },
      "Dashboard analytics retrieved successfully"
    );
  } catch (error) {
    console.error("GET DASHBOARD ANALYTICS ERROR:", error);
    if (
      error instanceof UnauthorizedError ||
      error instanceof ForbiddenError ||
      error instanceof InternalServerError
    ) {
      throw error;
    }
    throw new InternalServerError("Failed to retrieve dashboard analytics.");
  }
}
