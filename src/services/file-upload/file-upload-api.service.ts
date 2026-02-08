import { InternalServerError } from "@/lib/custom-error";
import { ActionResponse } from "@/types";

interface PresignedUrlResponse {
  uploadUrl: string;
  objectKey: string;
}

class FileUploadAPIService {
  private async getPresignedUrl(
    file: File,
    prefix?: string
  ): Promise<PresignedUrlResponse> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "/api"}/upload`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          prefix,
        }),
      }
    );

    if (!response.ok) {
      throw new InternalServerError("Failed to contact the upload API.");
    }

    const result: ActionResponse<PresignedUrlResponse> = await response.json();

    if (!result.success || !result.data) {
      throw new InternalServerError(
        result.details || "Failed to get a pre-signed URL from the API."
      );
    }

    return result.data;
  }

  async uploadImage(file: File, prefix?: string): Promise<string> {
    try {
      const { uploadUrl, objectKey } = await this.getPresignedUrl(file, prefix);

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(
          `Direct upload to storage failed with status: ${uploadResponse.status}`
        );
      }

      return objectKey;
    } catch (error) {
      console.error("Image upload failed:", error);
      throw new InternalServerError(
        "Could not upload the image. Please try again."
      );
    }
  }

  async deleteImage(objectKey: string): Promise<void> {
    try {
      await fetch("/api/upload", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ objectKey }),
      });
    } catch (error) {
      console.error("Image deletion failed:", error);
    }
  }
}

export const fileUploadAPIService = new FileUploadAPIService();
export default fileUploadAPIService;
