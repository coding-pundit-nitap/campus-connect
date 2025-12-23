import { AdminAction, Prisma } from "../../prisma/generated/client";

export const AUDIT_QUEUE_NAME = "audit-log-queue";

export interface AuditJobData {
  admin_id: string;
  action: AdminAction;
  target_type: string;
  target_id: string;
  details?: Prisma.JsonValue;
  ip_address?: string;
  user_agent?: string;
}
