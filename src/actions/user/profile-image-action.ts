"use server";

import { InternalServerError, UnauthorizedError } from "@/lib/custom-error";
import authUtils from "@/lib/utils/auth.utils.server";
import { userRepository } from "@/repositories";
import { fileUploadService } from "@/services/file-upload/file-upload.service";
import { ActionResponse, createSuccessResponse } from "@/types/response.types";

function isUploadedImage(image: string | null | undefined): boolean {
  if (!image) return false;
  return !image.startsWith("http://") && !image.startsWith("https://");
}

export async function updateProfileImageAction(
  file: File
): Promise<ActionResponse<{ image_key: string }>> {
  try {
    const user_id = await authUtils.getUserId();
    if (!user_id) {
      throw new UnauthorizedError("Unauthorized: Please log in.");
    }

    const user = await userRepository.findById(user_id, {
      select: { image: true },
    });

    const buffer = Buffer.from(await file.arrayBuffer());
    const image_key = await fileUploadService.upload(
      file.name,
      file.type,
      file.size,
      buffer,
      { prefix: "profile-images" }
    );

    if (user?.image && isUploadedImage(user.image)) {
      try {
        await fileUploadService.deleteFile(user.image);
      } catch (error) {
        console.warn("Failed to delete old profile image:", error);
      }
    }

    await userRepository.update(user_id, { image: image_key });

    return createSuccessResponse(
      { image_key },
      "Profile picture updated successfully"
    );
  } catch (error) {
    console.error("UPDATE PROFILE IMAGE ERROR:", error);
    throw new InternalServerError("Failed to update profile picture.");
  }
}
