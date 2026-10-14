import { buildFile } from "@tests/helpers/actions-user/builders";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fileUploadService, userRepository } from "@/di/container";
import { InternalServerError } from "@/lib/custom-error";
import authUtils from "@/lib/utils/auth.utils.server";

import { updateProfileImageAction } from "./profile-image-action";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);
vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);

const auth = vi.mocked(authUtils);
const users = vi.mocked(userRepository);
const uploads = vi.mocked(fileUploadService);

describe("updateProfileImageAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.getUserId.mockResolvedValue("user-1");
    uploads.uploadOptimizedImage.mockResolvedValue({ key: "new-key" } as never);
  });

  it("uploads the image, deletes the old uploaded one and saves the key", async () => {
    users.findById.mockResolvedValue({ image: "old-key" } as never);

    const res = await updateProfileImageAction(buildFile());

    expect(uploads.uploadOptimizedImage).toHaveBeenCalledWith(
      "pic.png",
      "image/png",
      3,
      expect.any(Buffer),
      { prefix: "profile-images" }
    );
    expect(uploads.deleteFile).toHaveBeenCalledWith("old-key");
    expect(users.update).toHaveBeenCalledWith("user-1", { image: "new-key" });
    expect(res).toMatchObject({
      data: { image_key: "new-key" },
      details: "Profile picture updated successfully",
    });
  });

  it.each([
    ["an external (OAuth) URL", { image: "https://cdn.example.com/a.png" }],
    ["an http URL", { image: "http://cdn.example.com/a.png" }],
    ["no previous image", { image: null }],
    ["no user record", null],
  ])("does not delete anything for %s", async (_case, user) => {
    users.findById.mockResolvedValue(user as never);

    await updateProfileImageAction(buildFile());

    expect(uploads.deleteFile).not.toHaveBeenCalled();
    expect(users.update).toHaveBeenCalled();
  });

  it("still saves the new image when deleting the old one fails", async () => {
    users.findById.mockResolvedValue({ image: "old-key" } as never);
    uploads.deleteFile.mockRejectedValue(new Error("s3"));

    await updateProfileImageAction(buildFile());

    expect(users.update).toHaveBeenCalledWith("user-1", { image: "new-key" });
  });

  it.each([
    ["no user", () => auth.getUserId.mockResolvedValue("")],
    [
      "a failed upload",
      () => uploads.uploadOptimizedImage.mockRejectedValue(new Error("s3")),
    ],
  ])("throws an InternalServerError on %s", async (_case, arrange) => {
    arrange();

    await expect(updateProfileImageAction(buildFile())).rejects.toThrow(
      new InternalServerError("Failed to update profile picture.")
    );
  });
});
