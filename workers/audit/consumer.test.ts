import { beforeEach, describe, expect, it, vi } from "vitest";

import { fakeLogger, FakeWorker } from "../../tests/helpers/workers/index.js";
import { Prisma } from "../generated/client/index.js";
import { loggers } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";
import { type AuditDeps, auditWorker, processAuditJob } from "./consumer.js";
import { AUDIT_QUEUE_NAME, type AuditJobData } from "./types.js";

vi.mock("bullmq", async () =>
  (await import("../../tests/helpers/workers/index.js")).bullmqModule()
);
vi.mock("../lib/logger.js", async () =>
  (await import("../../tests/helpers/workers/index.js")).loggerModule()
);
vi.mock("../lib/prisma.js", () => ({
  prisma: { adminAuditLog: { create: vi.fn() } },
}));
vi.mock("../lib/redis-connection.js", () => ({
  redisConnection: { host: "test-redis", port: 6379 },
}));

const jobData: AuditJobData = {
  admin_id: "admin-1",
  action: "SHOP_VERIFY",
  target_type: "user",
  target_id: "user-9",
  details: { reason: "spam" },
  ip_address: "10.0.0.1",
  user_agent: "vitest",
};

function makeDeps(): AuditDeps & {
  prisma: { adminAuditLog: { create: ReturnType<typeof vi.fn> } };
} {
  return {
    prisma: { adminAuditLog: { create: vi.fn() } },
    logger: fakeLogger(),
  } as never;
}

describe("processAuditJob", () => {
  beforeEach(vi.clearAllMocks);

  it("persists the audit log with every field from the job", async () => {
    const deps = makeDeps();

    await processAuditJob({ id: "job-1", data: jobData }, deps);

    expect(deps.prisma.adminAuditLog.create).toHaveBeenCalledWith({
      data: {
        admin_id: "admin-1",
        action: jobData.action,
        target_type: "user",
        target_id: "user-9",
        details: { reason: "spam" },
        ip_address: "10.0.0.1",
        user_agent: "vitest",
      },
    });
    expect(deps.logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: "job-1", target: "user:user-9" }),
      "Audit log created"
    );
  });

  it("stores Prisma.JsonNull when the job has no details", async () => {
    const deps = makeDeps();
    const withoutDetails: AuditJobData = { ...jobData, details: undefined };

    await processAuditJob({ id: "job-2", data: withoutDetails }, deps);

    expect(deps.prisma.adminAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ details: Prisma.JsonNull }),
    });
  });

  it("logs and rethrows when the insert fails", async () => {
    const deps = makeDeps();
    const failure = new Error("db down");
    deps.prisma.adminAuditLog.create.mockRejectedValue(failure);

    await expect(
      processAuditJob({ id: "job-3", data: jobData }, deps)
    ).rejects.toBe(failure);
    expect(deps.logger.error).toHaveBeenCalledWith(
      { err: failure, jobId: "job-3" },
      "Failed to create audit log"
    );
  });

  it("defaults to the shared prisma client and audit logger", async () => {
    await processAuditJob({ id: "job-4", data: jobData });

    expect(prisma.adminAuditLog.create).toHaveBeenCalledTimes(1);
    expect(loggers.audit.info).toHaveBeenCalled();
  });
});

describe("auditWorker", () => {
  const worker = auditWorker as unknown as FakeWorker;

  beforeEach(vi.clearAllMocks);

  it("consumes the audit queue with concurrency 5 on the shared connection", () => {
    expect(worker.name).toBe(AUDIT_QUEUE_NAME);
    expect(worker.opts).toEqual({
      connection: { host: "test-redis", port: 6379 },
      concurrency: 5,
    });
  });

  it("delegates jobs to processAuditJob", async () => {
    await worker.processor({ id: "job-5", data: jobData }, "token");

    expect(prisma.adminAuditLog.create).toHaveBeenCalledTimes(1);
  });

  it("logs completed jobs", () => {
    worker.emit("completed", { id: "job-6" });

    expect(loggers.audit.debug).toHaveBeenCalledWith(
      { jobId: "job-6" },
      "Audit log job completed"
    );
  });

  it.each([
    ["a job", { id: "job-7" }, "job-7"],
    ["no job", undefined, undefined],
  ])("logs failures for %s", (_label, job, jobId) => {
    const err = new Error("boom");

    worker.emit("failed", job, err);

    expect(loggers.audit.error).toHaveBeenCalledWith(
      { err, jobId },
      "Audit log job failed"
    );
  });
});
