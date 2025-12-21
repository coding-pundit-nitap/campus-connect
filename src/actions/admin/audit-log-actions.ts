"use server";

import z from "zod";

import { AdminAction, Prisma } from "@/../prisma/generated/client";
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
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

const AdminActionEnum = [
  "SHOP_VERIFY",
  "SHOP_REJECT",
  "SHOP_ACTIVATE",
  "SHOP_DEACTIVATE",
  "SHOP_DELETE",
  "USER_MAKE_ADMIN",
  "USER_REMOVE_ADMIN",
  "USER_SUSPEND",
  "USER_UNSUSPEND",
  "USER_DELETE",
  "USER_FORCE_SIGNOUT",
  "BROADCAST_CREATE",
  "ORDER_STATUS_OVERRIDE",
] as const;

const getAuditLogsSchema = searchSchema.extend({
  action: z.enum(AdminActionEnum).optional(),
  admin_id: z.string().optional(),
  target_type: z.string().optional(),
  target_id: z.string().optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
});

export type AuditLogEntry = {
  id: string;
  admin_id: string;
  admin_email: string | null;
  admin_name: string | null;
  action: AdminAction;
  target_type: string;
  target_id: string;
  details: Prisma.JsonValue | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
};

export async function getAuditLogsAction(
  options: z.infer<typeof getAuditLogsSchema>
): Promise<ActionResponse<CursorPaginatedResponse<AuditLogEntry>>> {
  try {
    await verifyAdmin();

    const parsedData = getAuditLogsSchema.safeParse(options);
    if (!parsedData.success) {
      throw new BadRequestError("Invalid options");
    }

    const {
      limit,
      cursor,
      search,
      action,
      admin_id,
      target_type,
      target_id,
      start_date,
      end_date,
    } = parsedData.data;

    const where: Prisma.AdminAuditLogWhereInput = {};

    if (action) {
      where.action = action;
    }

    if (admin_id) {
      where.admin_id = admin_id;
    }

    if (target_type) {
      where.target_type = target_type;
    }

    if (target_id) {
      where.target_id = target_id;
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
        { target_id: { contains: search, mode: "insensitive" } },
        { admin_id: { contains: search, mode: "insensitive" } },
      ];
    }

    const auditLogs = await prisma.adminAuditLog.findMany({
      where,
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        admin_id: true,
        action: true,
        target_type: true,
        target_id: true,
        details: true,
        ip_address: true,
        user_agent: true,
        created_at: true,
      },
    });

    const hasMore = auditLogs.length > limit;
    const data = hasMore ? auditLogs.slice(0, -1) : auditLogs;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    const adminIds = [...new Set(data.map((log) => log.admin_id))];
    const adminUsers = await prisma.user.findMany({
      where: { id: { in: adminIds } },
      select: { id: true, email: true, name: true },
    });
    const adminMap = new Map(adminUsers.map((u) => [u.id, u]));

    const enrichedData: AuditLogEntry[] = data.map((log) => {
      const admin = adminMap.get(log.admin_id);
      return {
        ...log,
        admin_email: admin?.email ?? null,
        admin_name: admin?.name ?? null,
      };
    });

    return createSuccessResponse(
      {
        data: enrichedData,
        nextCursor,
        hasMore,
      },
      "Audit logs retrieved successfully"
    );
  } catch (error) {
    console.error("GET AUDIT LOGS ERROR:", error);
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      throw error;
    }
    throw new InternalServerError("Failed to retrieve audit logs.");
  }
}

export type AuditLogStats = {
  totalLogs: number;
  todayLogs: number;
  recentActionCounts: { action: AdminAction; count: number }[];
  topAdmins: { admin_id: string; admin_name: string | null; count: number }[];
};

export async function getAuditLogStatsAction(): Promise<
  ActionResponse<AuditLogStats>
> {
  try {
    await verifyAdmin();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [totalLogs, todayLogs, recentActionCounts, topAdminGroups] =
      await Promise.all([
        prisma.adminAuditLog.count(),
        prisma.adminAuditLog.count({
          where: { created_at: { gte: today } },
        }),
        prisma.adminAuditLog.groupBy({
          by: ["action"],
          _count: { action: true },
          where: { created_at: { gte: sevenDaysAgo } },
          orderBy: { _count: { action: "desc" } },
          take: 10,
        }),
        prisma.adminAuditLog.groupBy({
          by: ["admin_id"],
          _count: { admin_id: true },
          where: { created_at: { gte: sevenDaysAgo } },
          orderBy: { _count: { admin_id: "desc" } },
          take: 5,
        }),
      ]);

    const adminIds = topAdminGroups.map((g) => g.admin_id);
    const adminUsers = await prisma.user.findMany({
      where: { id: { in: adminIds } },
      select: { id: true, name: true },
    });
    const adminMap = new Map(adminUsers.map((u) => [u.id, u.name]));

    return createSuccessResponse(
      {
        totalLogs,
        todayLogs,
        recentActionCounts: recentActionCounts.map((r) => ({
          action: r.action,
          count: r._count.action,
        })),
        topAdmins: topAdminGroups.map((g) => ({
          admin_id: g.admin_id,
          admin_name: adminMap.get(g.admin_id) ?? null,
          count: g._count.admin_id,
        })),
      },
      "Audit log statistics retrieved successfully"
    );
  } catch (error) {
    console.error("GET AUDIT LOG STATS ERROR:", error);
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      throw error;
    }
    throw new InternalServerError("Failed to retrieve audit log statistics.");
  }
}

export async function getRecentAuditLogsAction(
  limit: number = 10
): Promise<ActionResponse<AuditLogEntry[]>> {
  try {
    await verifyAdmin();

    const safeLimit = Math.min(Math.max(1, limit), 50);

    const auditLogs = await prisma.adminAuditLog.findMany({
      take: safeLimit,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        admin_id: true,
        action: true,
        target_type: true,
        target_id: true,
        details: true,
        ip_address: true,
        user_agent: true,
        created_at: true,
      },
    });

    const adminIds = [...new Set(auditLogs.map((log) => log.admin_id))];
    const adminUsers = await prisma.user.findMany({
      where: { id: { in: adminIds } },
      select: { id: true, email: true, name: true },
    });
    const adminMap = new Map(adminUsers.map((u) => [u.id, u]));

    const enrichedData: AuditLogEntry[] = auditLogs.map((log) => {
      const admin = adminMap.get(log.admin_id);
      return {
        ...log,
        admin_email: admin?.email ?? null,
        admin_name: admin?.name ?? null,
      };
    });

    return createSuccessResponse(
      enrichedData,
      "Recent audit logs retrieved successfully"
    );
  } catch (error) {
    console.error("GET RECENT AUDIT LOGS ERROR:", error);
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      throw error;
    }
    throw new InternalServerError("Failed to retrieve recent audit logs.");
  }
}
