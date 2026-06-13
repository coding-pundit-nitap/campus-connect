import { AdminAction, AdminAuditLog, Prisma } from "@/generated/client";
import { prisma } from "@/lib/prisma";

import { BaseRepository } from "./base.repository";

export type CreateAuditLogInput = {
  admin_id: string;
  action: AdminAction;
  target_type: string;
  target_id: string;
  details?: Prisma.JsonValue;
  ip_address?: string;
  user_agent?: string;
};

export class AdminAuditRepository extends BaseRepository<
  AdminAuditLog,
  Prisma.AdminAuditLogFindUniqueArgs,
  Prisma.AdminAuditLogFindManyArgs,
  Prisma.AdminAuditLogCreateArgs,
  Prisma.AdminAuditLogUpdateArgs,
  Prisma.AdminAuditLogDeleteArgs
> {
  constructor(private readonly prismaClient: typeof prisma = prisma) {
    super(prismaClient.adminAuditLog);
  }

  async create<T extends Prisma.AdminAuditLogCreateArgs>(
    args: T
  ): Promise<Prisma.Result<Prisma.AdminAuditLogDelegate, T, "create">>;
  override async create(
    args: Prisma.AdminAuditLogCreateArgs
  ): Promise<AdminAuditLog>;
  async create(data: CreateAuditLogInput): Promise<AdminAuditLog>;
  override async create(
    argsOrData: Prisma.AdminAuditLogCreateArgs | CreateAuditLogInput
  ): Promise<
    | AdminAuditLog
    | Prisma.Result<
        Prisma.AdminAuditLogDelegate,
        Prisma.AdminAuditLogCreateArgs,
        "create"
      >
  > {
    if (argsOrData && "data" in argsOrData) {
      return this.prismaClient.adminAuditLog.create(argsOrData);
    }
    const data = argsOrData as CreateAuditLogInput;
    return this.prismaClient.adminAuditLog.create({
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
  ): Promise<AdminAuditLog[]> {
    return this.prismaClient.adminAuditLog.findMany({
      where: { admin_id },
      orderBy: { created_at: "desc" },
      skip: options?.skip,
      take: options?.take,
    });
  }

  async findByTarget(
    target_type: string,
    target_id: string
  ): Promise<AdminAuditLog[]> {
    return this.prismaClient.adminAuditLog.findMany({
      where: { target_type, target_id },
      orderBy: { created_at: "desc" },
    });
  }

  async findRecent(limit: number = 50): Promise<AdminAuditLog[]> {
    return this.prismaClient.adminAuditLog.findMany({
      orderBy: { created_at: "desc" },
      take: limit,
    });
  }

  async count(args?: Prisma.AdminAuditLogCountArgs): Promise<number> {
    return this.prismaClient.adminAuditLog.count(args);
  }

  async aggregate<T extends Prisma.AdminAuditLogAggregateArgs>(args: T) {
    return this.prismaClient.adminAuditLog.aggregate(args);
  }

  async groupBy(args: Prisma.AdminAuditLogGroupByArgs) {
    return this.prismaClient.adminAuditLog.groupBy({
      orderBy: undefined,
      ...args,
    });
  }
}
