import { envelope } from "@tests/helpers/services";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosInstance from "@/lib/axios";

import { fileUploadAPIService } from "./file-upload-api.service";

const { put } = vi.hoisted(() => ({ put: vi.fn() }));
vi.mock("axios", () => ({ default: { put } }));
vi.mock("@/lib/axios", async () =>
  (await import("@tests/helpers/services")).axiosModule()
);

const axios = vi.mocked(axiosInstance);
const file = new File(["abc"], "pic.png", { type: "image/png" });

type PutConfig = {
  onUploadProgress: (e: { loaded: number; total?: number }) => void;
};
const progressHandler = () =>
  (put.mock.calls[0][2] as PutConfig).onUploadProgress;

describe("fileUploadAPIService", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("putToPreSignedUrl", () => {
    it("PUTs the file with its content type and a 2 minute timeout", async () => {
      await fileUploadAPIService.putToPreSignedUrl(file, "https://s3/put");

      expect(put).toHaveBeenCalledWith(
        "https://s3/put",
        file,
        expect.objectContaining({
          headers: { "Content-Type": "image/png" },
          timeout: 120_000,
        })
      );
    });

    it("reports rounded progress percentages", async () => {
      const onProgress = vi.fn();
      await fileUploadAPIService.putToPreSignedUrl(file, "u", onProgress);

      progressHandler()({ loaded: 1, total: 3 });

      expect(onProgress).toHaveBeenCalledWith(33);
    });

    it("ignores progress events without a total", async () => {
      const onProgress = vi.fn();
      await fileUploadAPIService.putToPreSignedUrl(file, "u", onProgress);

      progressHandler()({ loaded: 1 });

      expect(onProgress).not.toHaveBeenCalled();
    });

    it("tolerates progress events without a callback", async () => {
      await fileUploadAPIService.putToPreSignedUrl(file, "u");

      expect(() => progressHandler()({ loaded: 1, total: 2 })).not.toThrow();
    });
  });

  describe("uploadImage", () => {
    it("presigns, uploads and returns the object key", async () => {
      axios.post.mockResolvedValue(
        envelope({ presignedUrl: "https://s3/put", objectKey: "k/pic.png" })
      );

      const key = await fileUploadAPIService.uploadImage(file, "products");

      expect(key).toBe("k/pic.png");
      expect(axios.post).toHaveBeenCalledWith(
        "/upload",
        {
          fileName: "pic.png",
          fileType: "image/png",
          fileSize: 3,
          prefix: "products",
        },
        undefined
      );
      expect(put).toHaveBeenCalledWith(
        "https://s3/put",
        file,
        expect.anything()
      );
    });

    it("propagates presign failures without uploading", async () => {
      axios.post.mockRejectedValue(new Error("403"));

      await expect(fileUploadAPIService.uploadImage(file)).rejects.toThrow(
        "403"
      );
      expect(put).not.toHaveBeenCalled();
    });
  });

  describe("deleteImage", () => {
    it("deletes by object key", async () => {
      axios.delete.mockResolvedValue({});

      await fileUploadAPIService.deleteImage("k1");

      expect(axios.delete).toHaveBeenCalledWith("/upload", {
        data: { objectKey: "k1" },
      });
    });

    it("swallows deletion errors", async () => {
      axios.delete.mockRejectedValue(new Error("gone"));

      await expect(
        fileUploadAPIService.deleteImage("k1")
      ).resolves.toBeUndefined();
    });
  });
});
