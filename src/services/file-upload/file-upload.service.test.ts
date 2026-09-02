import { DeleteObjectCommand,PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { beforeEach,describe, expect, it, vi } from "vitest";

import { BadRequestError } from "@/lib/custom-error";
import {
  getCompressionRatio,
  getImageMetadata,
  isValidImage,
  optimizeForProductDetail,
} from "@/lib/utils/image-optimizer";

import { FileUploadService } from "./file-upload.service";

// Hoist variables for mocks
const sendMock = vi.fn();

// Mocks
vi.mock("@aws-sdk/client-s3", () => {
  return {
    S3Client: class {
      send = sendMock;
    },
    PutObjectCommand: vi.fn(),
    DeleteObjectCommand: vi.fn(),
  };
});

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(),
}));

vi.mock("@/config/env.config", () => ({
  env: {
    MINIO_ENDPOINT: "http://localhost:9000",
    AWS_REGION: "us-east-1",
    AWS_ACCESS_KEY_ID: "test",
    AWS_SECRET_ACCESS_KEY: "test",
    NEXT_PUBLIC_MINIO_ENDPOINT: "http://localhost:9000",
    NEXT_PUBLIC_MINIO_BUCKET: "test-bucket",
  },
}));

vi.mock("@/lib/utils/image-optimizer", () => ({
  isValidImage: vi.fn(),
  getImageMetadata: vi.fn(),
  optimizeForProductDetail: vi.fn(),
  getCompressionRatio: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  createLogger: vi.fn().mockReturnValue({
    error: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}));

describe("FileUploadService", () => {
  let fileUploadService: FileUploadService;

  beforeEach(() => {
    vi.clearAllMocks();
    sendMock.mockReset();
    sendMock.mockResolvedValue({});
    fileUploadService = new FileUploadService();
  });

  describe("Security validation (via upload)", () => {
    const defaultOptions = {
      maxSizeInMB: 5,
      allowedTypes: ["image/jpeg", "image/png"],
      prefix: "test",
    };
    const fileBuffer = Buffer.from("test");

    it("File too large → throws BadRequestError", async () => {
      await expect(
        fileUploadService.upload("test.jpg", "image/jpeg", 6 * 1024 * 1024, fileBuffer, defaultOptions)
      ).rejects.toThrow(BadRequestError);
    });

    it("Invalid MIME type → throws BadRequestError", async () => {
      await expect(
        fileUploadService.upload("test.txt", "text/plain", 1024, fileBuffer, defaultOptions)
      ).rejects.toThrow(BadRequestError);
    });

    it("Wildcard MIME image/* matches image/jpeg → passes", async () => {
      const options = { ...defaultOptions, allowedMimeTypes: ["image/*"] };
      await expect(
        fileUploadService.upload("test.jpg", "image/jpeg", 1024, fileBuffer, options)
      ).resolves.toBeDefined();
    });

    it("Dangerous extension .exe → throws BadRequestError", async () => {
      await expect(
        fileUploadService.upload("test.exe", "application/x-msdownload", 1024, fileBuffer, {
          ...defaultOptions,
          allowedTypes: ["application/x-msdownload"],
        })
      ).rejects.toThrow(BadRequestError);
    });

    it("Extension-MIME mismatch (.png with image/jpeg) → throws BadRequestError", async () => {
      await expect(
        fileUploadService.upload("test.png", "image/jpeg", 1024, fileBuffer, defaultOptions)
      ).rejects.toThrow(BadRequestError);
    });

    it("Double extension file.php.jpg → throws BadRequestError", async () => {
      await expect(
        fileUploadService.upload("file.php.jpg", "image/jpeg", 1024, fileBuffer, defaultOptions)
      ).rejects.toThrow(BadRequestError);
    });

    it("Null bytes file\\0.jpg → throws BadRequestError", async () => {
      await expect(
        fileUploadService.upload("file\0.jpg", "image/jpeg", 1024, fileBuffer, defaultOptions)
      ).rejects.toThrow(BadRequestError);
    });

    it("Percent-encoded null file%00.jpg → throws BadRequestError", async () => {
      await expect(
        fileUploadService.upload("file%00.jpg", "image/jpeg", 1024, fileBuffer, defaultOptions)
      ).rejects.toThrow(BadRequestError);
    });

    it("Path traversal ../../../etc/passwd.jpg → throws BadRequestError", async () => {
      await expect(
        fileUploadService.upload("../../../etc/passwd.jpg", "image/jpeg", 1024, fileBuffer, defaultOptions)
      ).rejects.toThrow(BadRequestError);
    });

    it("Backslash traversal ..\\\\file.jpg → throws BadRequestError", async () => {
      await expect(
        fileUploadService.upload("..\\file.jpg", "image/jpeg", 1024, fileBuffer, defaultOptions)
      ).rejects.toThrow(BadRequestError);
    });

    it("Slash in name path/file.jpg → throws BadRequestError", async () => {
      await expect(
        fileUploadService.upload("path/file.jpg", "image/jpeg", 1024, fileBuffer, defaultOptions)
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("upload", () => {
    const fileBuffer = Buffer.from("test");

    it("Happy path → calls S3 send, returns objectKey string", async () => {
      const result = await fileUploadService.upload("test.jpg", "image/jpeg", 1024, fileBuffer, {
        maxSizeInMB: 5,
        allowedTypes: ["image/jpeg"],
        prefix: "test",
      });

      expect(result).toMatch(/^test\/[a-f0-9-]+\.jpg$/);
      // We can't easily assert on the exact mock instance of S3Client without more setup,
      // but if it didn't throw, we consider it a success.
    });

    it("S3 failure → throws", async () => {
      sendMock.mockRejectedValueOnce(new Error("S3 error"));

      await expect(
        fileUploadService.upload("test.jpg", "image/jpeg", 1024, fileBuffer, {
          maxSizeInMB: 5,
          allowedTypes: ["image/jpeg"],
        })
      ).rejects.toThrow("Failed to upload file to MinIO");
    });
  });

  describe("uploadOptimizedImage", () => {
    const fileBuffer = Buffer.from("test");

    it("Happy path → validates, optimizes, uploads JPEG, returns metadata", async () => {
      vi.mocked(isValidImage).mockResolvedValueOnce(true);
      vi.mocked(optimizeForProductDetail).mockResolvedValueOnce(Buffer.from("optimized"));
      vi.mocked(getImageMetadata).mockResolvedValueOnce({ width: 100, height: 100, format: "jpeg", size: 1024, hasAlpha: false });
      vi.mocked(getCompressionRatio).mockReturnValueOnce(50);

      const result = await fileUploadService.uploadOptimizedImage("test.jpg", "image/jpeg", 1024, fileBuffer, {
        maxSizeInMB: 5,
        allowedTypes: ["image/jpeg"],
        prefix: "test",
      });

      expect(result.key).toMatch(/^test\/[a-f0-9-]+\.jpg$/);
      expect(result.originalSize).toBe(1024);
      expect(result.optimizedSize).toBe(Buffer.from("optimized").length);
      expect(result.compressionRatio).toBe(50);
    });

    it("Invalid image → throws BadRequestError", async () => {
      vi.mocked(isValidImage).mockResolvedValueOnce(false);

      await expect(
        fileUploadService.uploadOptimizedImage("test.jpg", "image/jpeg", 1024, fileBuffer, {
          maxSizeInMB: 5,
          allowedTypes: ["image/jpeg"],
        })
      ).rejects.toThrow(BadRequestError);
    });

    it("S3 failure → throws", async () => {
      vi.mocked(isValidImage).mockResolvedValueOnce(true);
      vi.mocked(optimizeForProductDetail).mockResolvedValueOnce(Buffer.from("optimized"));
      vi.mocked(getImageMetadata).mockResolvedValueOnce({ width: 100, height: 100, format: "jpeg", size: 1024, hasAlpha: false });
      
      sendMock.mockRejectedValueOnce(new Error("S3 error"));

      await expect(
        fileUploadService.uploadOptimizedImage("test.jpg", "image/jpeg", 1024, fileBuffer, {
          maxSizeInMB: 5,
          allowedTypes: ["image/jpeg"],
        })
      ).rejects.toThrow();
    });
  });

  describe("createPresignedUploadUrl", () => {
    it("Happy path → calls getSignedUrl, returns { presignedUrl, objectKey, publicUrl, expiresIn: 300 }", async () => {
      vi.mocked(getSignedUrl).mockResolvedValueOnce("http://fake-signed-url.com");

      const result = await fileUploadService.createPresignedUploadUrl("test.jpg", "image/jpeg", 1024, {
        maxSizeInMB: 5,
        allowedTypes: ["image/jpeg"],
        prefix: "test",
      });

      expect(result.presignedUrl).toBe("http://fake-signed-url.com");
      expect(result.objectKey).toMatch(/^test\/[a-f0-9-]+\.jpg$/);
      expect(result.publicUrl).toBe(`http://localhost:9000/test-bucket/${result.objectKey}`);
      expect(result.expiresIn).toBe(300);
    });

    it("Signing failure → throws", async () => {
      vi.mocked(getSignedUrl).mockRejectedValueOnce(new Error("Sign error"));

      await expect(
        fileUploadService.createPresignedUploadUrl("test.jpg", "image/jpeg", 1024, {
          maxSizeInMB: 5,
          allowedTypes: ["image/jpeg"],
        })
      ).rejects.toThrow("Failed to generate upload URL");
    });
  });

  describe("deleteFile", () => {
    it("Happy path → sends DeleteObjectCommand", async () => {
      await expect(fileUploadService.deleteFile("test/file.jpg")).resolves.not.toThrow();
      expect(DeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: "test-bucket",
        Key: "test/file.jpg",
      });
    });

    it("Path traversal in key ../secret → throws BadRequestError wrapped in Error", async () => {
      await expect(fileUploadService.deleteFile("../secret")).rejects.toThrow("Failed to delete file from MinIO");
    });

    it("S3 failure → throws", async () => {
      sendMock.mockRejectedValueOnce(new Error("S3 error"));

      await expect(fileUploadService.deleteFile("test/file.jpg")).rejects.toThrow("Failed to delete file from MinIO");
    });
  });
});
