"use server";

import { container } from "@/di/container";
import {
  ForbiddenError,
  InternalServerError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/custom-error";
import { createLogger } from "@/lib/logger";
import { ActionResponse, createSuccessResponse } from "@/types/response.types";

import { verifyAdmin } from "../authentication/admin";
const log = createLogger("settings-actions");

export async function getSystemHealthAction(): Promise<
  ActionResponse<{
    database: { connected: boolean; responseTime: number };
    stats: {
      totalRecords: number;
      oldestAuditLog: Date | null;
      newestAuditLog: Date | null;
    };
  }>
> {
  try {
    await verifyAdmin();

    const dbStart = Date.now();
    await container.db.$queryRaw`SELECT 1`;
    const dbResponseTime = Date.now() - dbStart;

    const [totalUsers, totalShops, totalOrders, totalProducts, auditLogRange] =
      await Promise.all([
        container.userRepository.count(),
        container.shopRepository.count(),
        container.orderRepository.count(),
        container.productRepository.count(),
        container.adminAuditRepository.aggregate({
          _min: { created_at: true },
          _max: { created_at: true },
        }),
      ]);

    return createSuccessResponse(
      {
        database: {
          connected: true,
          responseTime: dbResponseTime,
        },
        stats: {
          totalRecords: totalUsers + totalShops + totalOrders + totalProducts,
          oldestAuditLog: auditLogRange._min?.created_at ?? null,
          newestAuditLog: auditLogRange._max?.created_at ?? null,
        },
      },
      "System health check completed"
    );
  } catch (error) {
    log.error({ err: error }, "SYSTEM HEALTH CHECK ERROR:");
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      throw error;
    }
    throw new InternalServerError("Failed to check system health.");
  }
}

/**
 * Get storage/cleanup statistics - how many old records could be cleaned up.
 */
export async function getCleanupStatsAction(): Promise<
  ActionResponse<{
    oldNotifications: number;
    oldAuditLogs: number;
    expiredSessions: number;
    orphanedCarts: number;
  }>
> {
  try {
    await verifyAdmin();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const [oldNotifications, oldAuditLogs, expiredSessions, orphanedCarts] =
      await Promise.all([
        container.notificationRepository.count({
          where: {
            read: true,
            created_at: { lt: thirtyDaysAgo },
          },
        }),
        container.adminAuditRepository.count({
          where: {
            created_at: { lt: ninetyDaysAgo },
          },
        }),
        container.db.session.count({
          where: {
            expiresAt: { lt: new Date() },
          },
        }),
        container.cartRepository.count({
          where: {
            items: { none: {} },
          },
        }),
      ]);

    return createSuccessResponse(
      {
        oldNotifications,
        oldAuditLogs,
        expiredSessions,
        orphanedCarts,
      },
      "Cleanup statistics retrieved"
    );
  } catch (error) {
    log.error({ err: error }, "CLEANUP STATS ERROR:");
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      throw error;
    }
    throw new InternalServerError("Failed to get cleanup statistics.");
  }
}

/**
 * Clean up old data.
 */
export async function runCleanupAction(
  type: "notifications" | "sessions" | "carts"
): Promise<ActionResponse<{ deletedCount: number }>> {
  try {
    const adminId = await verifyAdmin();

    let deletedCount = 0;

    switch (type) {
      case "notifications": {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const result = await container.db.notification.deleteMany({
          where: {
            read: true,
            created_at: { lt: thirtyDaysAgo },
          },
        });
        deletedCount = result.count;
        break;
      }
      case "sessions": {
        const result = await container.db.session.deleteMany({
          where: {
            expiresAt: { lt: new Date() },
          },
        });
        deletedCount = result.count;
        break;
      }
      case "carts": {
        const result = await container.db.cart.deleteMany({
          where: {
            items: { none: {} },
          },
        });
        deletedCount = result.count;
        break;
      }
    }

    await container.adminAuditRepository.create({
      data: {
        admin_id: adminId,
        action: "ORDER_STATUS_OVERRIDE",
        target_type: "CLEANUP",
        target_id: type.toUpperCase(),
        details: { deleted_count: deletedCount },
      },
    });

    return createSuccessResponse(
      { deletedCount },
      `Cleaned up ${deletedCount} ${type}`
    );
  } catch (error) {
    log.error({ err: error }, "CLEANUP ERROR:");
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      throw error;
    }
    throw new InternalServerError("Failed to run cleanup.");
  }
}

/**
 * Get platform overview statistics for settings page.
 */
export async function getPlatformOverviewAction(): Promise<
  ActionResponse<{
    users: { total: number; active: number; admins: number; suspended: number };
    shops: { total: number; active: number; verified: number; pending: number };
    products: { total: number; inStock: number; outOfStock: number };
    orders: {
      total: number;
      pending: number;
      completed: number;
      cancelled: number;
    };
    reviews: { total: number; averageRating: number };
    payouts: { pending: number; completed: number; totalPending: number };
  }>
> {
  try {
    await verifyAdmin();

    const [
      totalUsers,
      activeUsers,
      adminUsers,
      suspendedUsers,
      totalShops,
      activeShops,
      verifiedShops,
      pendingShops,
      totalProducts,
      inStockProducts,
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      totalReviews,
      reviewStats,
      pendingPayouts,
      completedPayouts,
      pendingPayoutAmount,
    ] = await Promise.all([
      container.userRepository.count(),
      container.userRepository.count({ where: { status: "ACTIVE" } }),
      container.userRepository.count({ where: { role: "ADMIN" } }),
      container.userRepository.count({ where: { status: "SUSPENDED" } }),
      container.shopRepository.count(),
      container.shopRepository.count({ where: { is_active: true } }),
      container.shopRepository.count({
        where: { verification_status: "VERIFIED" },
      }),
      container.shopRepository.count({
        where: { verification_status: "PENDING" },
      }),
      container.productRepository.count(),
      container.productRepository.count({
        where: { stock_quantity: { gt: 0 } },
      }),
      container.orderRepository.count(),
      container.orderRepository.count({
        where: {
          order_status: { in: ["NEW", "BATCHED", "OUT_FOR_DELIVERY"] },
        },
      }),
      container.orderRepository.count({ where: { order_status: "COMPLETED" } }),
      container.orderRepository.count({ where: { order_status: "CANCELLED" } }),
      container.reviewRepository.count(),
      container.reviewRepository.aggregate({ _avg: { rating: true } }),
      container.payoutRepository.count({
        where: { status: { in: ["PENDING", "IN_TRANSIT"] } },
      }),
      container.payoutRepository.count({ where: { status: "PAID" } }),
      container.payoutRepository.aggregate({
        where: { status: { in: ["PENDING", "IN_TRANSIT"] } },
        _sum: { amount: true },
      }),
    ]);

    return createSuccessResponse(
      {
        users: {
          total: totalUsers,
          active: activeUsers,
          admins: adminUsers,
          suspended: suspendedUsers,
        },
        shops: {
          total: totalShops,
          active: activeShops,
          verified: verifiedShops,
          pending: pendingShops,
        },
        products: {
          total: totalProducts,
          inStock: inStockProducts,
          outOfStock: totalProducts - inStockProducts,
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          completed: completedOrders,
          cancelled: cancelledOrders,
        },
        reviews: {
          total: totalReviews,
          averageRating: reviewStats._avg?.rating ?? 0,
        },
        payouts: {
          pending: pendingPayouts,
          completed: completedPayouts,
          totalPending: Number(pendingPayoutAmount._sum?.amount ?? 0),
        },
      },
      "Platform overview retrieved"
    );
  } catch (error) {
    log.error({ err: error }, "PLATFORM OVERVIEW ERROR:");
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      throw error;
    }
    throw new InternalServerError("Failed to get platform overview.");
  }
}

/**
 * Get current platform settings including global platform fee.
 */
export async function getPlatformSettingsAction(): Promise<
  ActionResponse<{ platform_fee: number }>
> {
  try {
    await verifyAdmin();

    const platformFee =
      await container.platformSettingsRepository.getPlatformFee();

    return createSuccessResponse(
      { platform_fee: platformFee },
      "Platform settings retrieved"
    );
  } catch (error) {
    log.error({ err: error }, "GET PLATFORM SETTINGS ERROR:");
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      throw error;
    }
    throw new InternalServerError("Failed to get platform settings.");
  }
}

/**
 * Update global platform fee (admin only).
 */
export async function updatePlatformFeeAction(
  fee: number
): Promise<ActionResponse<{ platform_fee: number }>> {
  try {
    const adminId = await verifyAdmin();

    if (typeof fee !== "number" || fee < 0) {
      throw new ValidationError("Platform fee must be a non-negative number.");
    }

    const settings =
      await container.platformSettingsRepository.updatePlatformFee(fee);

    await container.adminAuditRepository.create({
      data: {
        admin_id: adminId,
        action: "ORDER_STATUS_OVERRIDE",
        target_type: "PLATFORM_SETTINGS",
        target_id: "default",
        details: { new_platform_fee: fee },
      },
    });

    return createSuccessResponse(
      { platform_fee: Number(settings.platform_fee) },
      "Platform fee updated successfully"
    );
  } catch (error) {
    log.error({ err: error }, "UPDATE PLATFORM FEE ERROR:");
    if (
      error instanceof UnauthorizedError ||
      error instanceof ForbiddenError ||
      error instanceof ValidationError
    ) {
      throw error;
    }
    throw new InternalServerError("Failed to update platform fee.");
  }
}
