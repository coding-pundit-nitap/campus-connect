import { headers } from "next/headers";

import { AdminAction, Prisma } from "@/../prisma/generated/client";
import { AuditJobData, auditQueue } from "@/lib/audit";

class AuditService {
  async log(
    adminId: string,
    action: AdminAction,
    targetType: string,
    targetId: string,
    details?: Prisma.JsonValue
  ): Promise<void> {
    let ipAddress: string | undefined;
    let userAgent: string | undefined;

    try {
      const headersList = await headers();
      ipAddress =
        headersList.get("x-forwarded-for")?.split(",")[0] ||
        headersList.get("x-real-ip") ||
        undefined;
      userAgent = headersList.get("user-agent") || undefined;
    } catch {
      // Headers not available
    }

    const jobData: AuditJobData = {
      admin_id: adminId,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
      ip_address: ipAddress,
      user_agent: userAgent,
    };

    await auditQueue.add("audit-log", jobData);
  }

  async logWithContext(
    adminId: string,
    action: AdminAction,
    targetType: string,
    targetId: string,
    details?: Prisma.JsonValue,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const jobData: AuditJobData = {
      admin_id: adminId,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
      ip_address: ipAddress,
      user_agent: userAgent,
    };

    await auditQueue.add("audit-log", jobData);
  }
}

export const auditService = new AuditService();
export default auditService;
