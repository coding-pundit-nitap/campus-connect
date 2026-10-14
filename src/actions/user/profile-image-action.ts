"use server";

import { requireUserId, runAction } from "@/actions/_shared/action-helpers";
import { fileUploadService, userRepository } from "@/di/container";
import { createLogger } from "@/lib/logger";
import { ActionResponse, createSuccessResponse } from "@/types/response.types";
const log = createLogger("profile-image-action");

/** True for keys of images we stored (not external OAuth avatar URLs). */
function isUploadedImage(image: string): boolean {
  return !image.startsWith("http://") && !image.startsWith("https://");
}

export async function updateProfileImageAction(
  file: File
): Promise<ActionResponse<{ image_key: string }>> {
  return runAction(
    log,
    {
      label: "UPDATE PROFILE IMAGE ERROR:",
      fallback: "Failed to update profile picture.",
    },
    async () => {
      const user_id = await requireUserId();

      const user = await userRepository.findById(user_id, {
        select: { image: true },
      });

      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadResult = await fileUploadService.uploadOptimizedImage(
        file.name,
        file.type,
        file.size,
        buffer,
        { prefix: "profile-images" }
      );
      const image_key = uploadResult.key;

      if (user?.image && isUploadedImage(user.image)) {
        try {
          await fileUploadService.deleteFile(user.image);
        } catch (error) {
          log.warn(`Failed to delete old profile image: ${error}`);
        }
      }

      await userRepository.update(user_id, { image: image_key });

      return createSuccessResponse(
        { image_key },
        "Profile picture updated successfully"
      );
    }
  );
}
