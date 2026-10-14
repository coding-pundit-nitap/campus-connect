import { Job, Worker } from "bullmq";
import type { Logger } from "pino";

import { Prisma } from "../generated/client/index.js";
import { loggers } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";
import { redisConnection } from "../lib/redis-connection.js";
import { AUDIT_QUEUE_NAME, AuditJobData } from "./types.js";

const logger = loggers.audit;

export interface AuditDeps {
  prisma: Pick<typeof prisma, "adminAuditLog">;
  logger: Logger;
}

const defaultDeps: AuditDeps = { prisma, logger };

export async function processAuditJob(
  job: Pick<Job<AuditJobData>, "id" | "data">,
  deps: AuditDeps = defaultDeps
): Promise<void> {
  deps.logger.debug(
    { jobId: job.id, action: job.data.action },
    "Processing audit log job"
  );

  try {
    await deps.prisma.adminAuditLog.create({
      data: {
        admin_id: job.data.admin_id,
        action: job.data.action,
        target_type: job.data.target_type,
        target_id: job.data.target_id,
        details: job.data.details ?? Prisma.JsonNull,
        ip_address: job.data.ip_address,
        user_agent: job.data.user_agent,
      },
    });

    deps.logger.info(
      {
        jobId: job.id,
        adminId: job.data.admin_id,
        action: job.data.action,
        target: `${job.data.target_type}:${job.data.target_id}`,
      },
      "Audit log created"
    );
  } catch (error) {
    deps.logger.error(
      { err: error, jobId: job.id },
      "Failed to create audit log"
    );
    throw error;
  }
}

export const auditWorker = new Worker<AuditJobData>(
  AUDIT_QUEUE_NAME,
  (job) => processAuditJob(job),
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

auditWorker.on("completed", (job) => {
  logger.debug({ jobId: job.id }, "Audit log job completed");
});

auditWorker.on("failed", (job, err) => {
  logger.error({ err, jobId: job?.id }, "Audit log job failed");
});
