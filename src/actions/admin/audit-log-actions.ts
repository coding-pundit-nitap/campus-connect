"use server";

import z from "zod";

import { container } from "@/di/container";
import { AdminAction, Prisma } from "@/generated/client";
import { BadRequestError } from "@/lib/custom-error";
import { createLogger } from "@/lib/logger";
import {
  ActionResponse,
  createSuccessResponse,
  CursorPaginatedResponse,
} from "@/types/response.types";
import { searchSchema } from "@/validations";

import {
  cursorArgs,
  dateRange,
  groupCount,
  runAdminAction,
  toCursorPage,
} from "./_shared";
const log = createLogger("audit-log-actions");

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

const auditLogSelect = {
  id: true,
  admin_id: true,
  action: true,
  target_type: true,
  target_id: true,
  details: true,
  ip_address: true,
  user_agent: true,
  created_at: true,
} as const;

type AuditLogRow = Omit<AuditLogEntry, "admin_email" | "admin_name">;

/** Attaches each log's admin email and name (null when the admin is gone). */
async function withAdminInfo(logs: AuditLogRow[]): Promise<AuditLogEntry[]> {
  const adminIds = [...new Set(logs.map((log) => log.admin_id))];
  const adminUsers = await container.userRepository.findMany({
    where: { id: { in: adminIds } },
    select: { id: true, email: true, name: true },
  });
  const adminMap = new Map(adminUsers.map((u) => [u.id, u]));

  return logs.map((log) => {
    const admin = adminMap.get(log.admin_id);
    return {
      ...log,
      admin_email: admin?.email ?? null,
      admin_name: admin?.name ?? null,
    };
  });
}

export async function getAuditLogsAction(
  options: z.infer<typeof getAuditLogsSchema>
): Promise<ActionResponse<CursorPaginatedResponse<AuditLogEntry>>> {
  return runAdminAction(
    log,
    {
      label: "GET AUDIT LOGS ERROR:",
      fallback: "Failed to retrieve audit logs.",
    },
    async () => {
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

      const createdAt = dateRange(start_date, end_date);
      if (createdAt) {
        where.created_at = createdAt;
      }

      if (search) {
        where.OR = [
          { target_id: { contains: search, mode: "insensitive" } },
          { admin_id: { contains: search, mode: "insensitive" } },
        ];
      }

      const auditLogs = await container.adminAuditRepository.findMany({
        where,
        ...cursorArgs(limit, cursor),
        orderBy: { created_at: "desc" },
        select: auditLogSelect,
      });

      const { data, nextCursor, hasMore } = toCursorPage(auditLogs, limit);

      const enrichedData = await withAdminInfo(data);

      return createSuccessResponse(
        {
          data: enrichedData,
          nextCursor,
          hasMore,
        },
        "Audit logs retrieved successfully"
      );
    }
  );
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
  return runAdminAction(
    log,
    {
      label: "GET AUDIT LOG STATS ERROR:",
      fallback: "Failed to retrieve audit log statistics.",
    },
    async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [totalLogs, todayLogs, recentActionCounts, topAdminGroups] =
        await Promise.all([
          container.adminAuditRepository.count(),
          container.adminAuditRepository.count({
            where: { created_at: { gte: today } },
          }),
          container.adminAuditRepository.groupBy({
            by: ["action"],
            _count: { action: true },
            where: { created_at: { gte: sevenDaysAgo } },
            orderBy: { _count: { action: "desc" } },
            take: 10,
          }),
          container.adminAuditRepository.groupBy({
            by: ["admin_id"],
            _count: { admin_id: true },
            where: { created_at: { gte: sevenDaysAgo } },
            orderBy: { _count: { admin_id: "desc" } },
            take: 5,
          }),
        ]);

      const adminIds = topAdminGroups.map((g) => g.admin_id);
      const adminUsers = await container.userRepository.findMany({
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
            count: groupCount(r._count, "action"),
          })),
          topAdmins: topAdminGroups.map((g) => ({
            admin_id: g.admin_id,
            admin_name: adminMap.get(g.admin_id) ?? null,
            count: groupCount(g._count, "admin_id"),
          })),
        },
        "Audit log statistics retrieved successfully"
      );
    }
  );
}

export async function getRecentAuditLogsAction(
  limit: number = 10
): Promise<ActionResponse<AuditLogEntry[]>> {
  return runAdminAction(
    log,
    {
      label: "GET RECENT AUDIT LOGS ERROR:",
      fallback: "Failed to retrieve recent audit logs.",
    },
    async () => {
      const safeLimit = Math.min(Math.max(1, limit), 50);

      const auditLogs = await container.adminAuditRepository.findMany({
        take: safeLimit,
        orderBy: { created_at: "desc" },
        select: auditLogSelect,
      });

      const enrichedData = await withAdminInfo(auditLogs);

      return createSuccessResponse(
        enrichedData,
        "Recent audit logs retrieved successfully"
      );
    }
  );
}
