import { Queue } from "bullmq";

import { AdminAction, Prisma } from "@/generated/client";

import { redisConnection } from "../redis-connection";

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

export const auditQueue = new Queue<AuditJobData>(AUDIT_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: 100,
  },
});
