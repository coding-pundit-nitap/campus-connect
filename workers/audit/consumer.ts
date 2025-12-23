import { Job, Worker } from "bullmq";

import { Prisma } from "../../prisma/generated/client";
import { loggers } from "../lib/logger";
import { prisma } from "../lib/prisma";
import { redisConnection } from "../lib/redis-connection";
import { AUDIT_QUEUE_NAME, AuditJobData } from "./types";

const logger = loggers.audit;

const workHandler = async (job: Job<AuditJobData>) => {
  logger.debug(
    { jobId: job.id, action: job.data.action },
    "Processing audit log job"
  );

  try {
    await prisma.adminAuditLog.create({
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

    logger.info(
      {
        jobId: job.id,
        adminId: job.data.admin_id,
        action: job.data.action,
        target: `${job.data.target_type}:${job.data.target_id}`,
      },
      "Audit log created"
    );
  } catch (error) {
    logger.error({ err: error, jobId: job.id }, "Failed to create audit log");
    throw error;
  }
};

export const auditWorker = new Worker<AuditJobData>(
  AUDIT_QUEUE_NAME,
  workHandler,
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
