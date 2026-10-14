import { makeRequest } from "@tests/helpers";
import { expectError, expectSuccess } from "@tests/helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);
vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);

import { fileUploadService } from "@/di/container";
import authUtils from "@/lib/utils/auth.utils.server";

import * as uploadRoute from "./route";

const { POST } = uploadRoute;
const auth = vi.mocked(authUtils);
const uploads = vi.mocked(fileUploadService);
const valid = { fileName: "a.png", fileType: "image/png", fileSize: 1024 };
const post = (body: unknown) =>
  POST(makeRequest("/api/upload", { method: "POST", body }));

describe("DELETE /api/upload", () => {
  it("no longer exists as a route handler", () => {
    expect(uploadRoute).not.toHaveProperty("DELETE");
  });
});

describe("POST /api/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.isAuthenticated.mockResolvedValue(true);
  });

  it("creates a presigned upload URL", async () => {
    uploads.createPresignedUploadUrl.mockResolvedValue({
      uploadUrl: "https://s3/put",
    } as never);

    expect(
      await expectSuccess(await post({ ...valid, prefix: "shops" }))
    ).toEqual({ uploadUrl: "https://s3/put" });
    expect(uploads.createPresignedUploadUrl).toHaveBeenCalledWith(
      "a.png",
      "image/png",
      1024,
      { prefix: "shops" }
    );
  });

  it("returns 401 when not authenticated", async () => {
    auth.isAuthenticated.mockResolvedValue(false);

    await expectError(await post(valid), 401, "Unauthorized");
    expect(uploads.createPresignedUploadUrl).not.toHaveBeenCalled();
  });

  it.each([
    [{ ...valid, fileName: "" }, "Invalid input: File name is required"],
    [{ ...valid, fileSize: 0 }, "Invalid input: File size must be positive"],
    [{ ...valid, fileSize: 11 * 1024 * 1024 }, "Invalid input: File too large"],
  ])("returns 400 for invalid input (%o)", async (body, message) => {
    await expectError(await post(body), 400, message);
  });

  it("returns 500 when presigning fails", async () => {
    uploads.createPresignedUploadUrl.mockRejectedValue(new Error("s3"));

    await expectError(await post(valid), 500, "Upload preparation failed.");
  });
});
