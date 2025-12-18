import { AdminAction, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type CreateAuditLogInput = {
  admin_id: string;
  action: AdminAction;
  target_type: string;
  target_id: string;
  details?: Prisma.JsonValue;
  ip_address?: string;
  user_agent?: string;
};

class AdminAuditRepository {
  async create(data: CreateAuditLogInput) {
    return prisma.adminAuditLog.create({
      data: {
        admin_id: data.admin_id,
        action: data.action,
        target_type: data.target_type,
        target_id: data.target_id,
        details: data.details ?? Prisma.JsonNull,
        ip_address: data.ip_address,
        user_agent: data.user_agent,
      },
    });
  }

  async findByAdminId(
    admin_id: string,
    options?: { skip?: number; take?: number }
  ) {
    return prisma.adminAuditLog.findMany({
      where: { admin_id },
      orderBy: { created_at: "desc" },
      skip: options?.skip,
      take: options?.take,
    });
  }

  async findByTarget(target_type: string, target_id: string) {
    return prisma.adminAuditLog.findMany({
      where: { target_type, target_id },
      orderBy: { created_at: "desc" },
    });
  }

  async findRecent(limit: number = 50) {
    return prisma.adminAuditLog.findMany({
      orderBy: { created_at: "desc" },
      take: limit,
    });
  }

  async count(where?: Prisma.AdminAuditLogWhereInput) {
    return prisma.adminAuditLog.count({ where });
  }
}

export const adminAuditRepository = new AdminAuditRepository();
export default adminAuditRepository;
