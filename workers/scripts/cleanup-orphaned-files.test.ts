import { S3Client } from "@aws-sdk/client-s3";
import { config } from "dotenv";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "../lib/prisma.js";
import { cleanupOrphanedFiles } from "./orphaned-files.js";

vi.mock("dotenv", () => ({ config: vi.fn() }));
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(function S3Client() {}),
}));
vi.mock("../lib/env.js", () => ({
  env: {
    MINIO_ENDPOINT: "http://minio:9000",
    AWS_REGION: "",
    AWS_ACCESS_KEY_ID: "id",
    AWS_SECRET_ACCESS_KEY: "secret",
    NEXT_PUBLIC_MINIO_BUCKET: "",
  },
}));
vi.mock("../lib/prisma.js", () => ({ prisma: { $disconnect: vi.fn() } }));
vi.mock("./orphaned-files.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./orphaned-files.js")>()),
  cleanupOrphanedFiles: vi.fn(),
}));

const { exitSpy, errorSpy } = vi.hoisted(() => ({
  exitSpy: vi
    .spyOn(process, "exit")
    .mockImplementation((() => undefined) as never),
  errorSpy: vi.spyOn(console, "error").mockImplementation(() => undefined),
}));

const script = await import("./cleanup-orphaned-files.js");

afterAll(() => {
  exitSpy.mockRestore();
  errorSpy.mockRestore();
});

describe("cleanup-orphaned-files CLI", () => {
  it("loads .env and runs once on import", () => {
    expect(config).toHaveBeenCalledWith({ path: ".env" });
    expect(cleanupOrphanedFiles).toHaveBeenCalled();
  });

  describe("main", () => {
    beforeEach(vi.clearAllMocks);

    it.each([
      [["node", "script"], false],
      [["node", "script", "--dry-run"], true],
    ])("passes dryRun for argv %j", async (argv, dryRun) => {
      await script.main(argv);

      expect(cleanupOrphanedFiles).toHaveBeenCalledWith(
        dryRun,
        expect.objectContaining({
          bucketName: "campus-connect",
          batchSize: 100,
          console,
        })
      );
      expect(prisma.$disconnect).toHaveBeenCalledTimes(1);
      expect(exitSpy).not.toHaveBeenCalled();
    });

    it("reads argv from the process by default", async () => {
      await script.main();

      expect(cleanupOrphanedFiles).toHaveBeenCalledTimes(1);
    });

    it("logs, exits 1 and still disconnects when cleanup fails", async () => {
      const failure = new Error("s3 down");
      vi.mocked(cleanupOrphanedFiles).mockRejectedValueOnce(failure);

      await script.main(["node", "script"]);

      expect(errorSpy).toHaveBeenCalledWith("❌ Cleanup failed:", failure);
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(prisma.$disconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe("createS3Client", () => {
    it("targets MinIO with path-style addressing and a region fallback", () => {
      vi.clearAllMocks();

      script.createS3Client();

      expect(S3Client).toHaveBeenCalledWith({
        endpoint: "http://minio:9000",
        region: "us-east-1",
        credentials: { accessKeyId: "id", secretAccessKey: "secret" },
        forcePathStyle: true,
      });
    });
  });
});
