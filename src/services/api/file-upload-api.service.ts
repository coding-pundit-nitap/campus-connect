import { InternalServerError } from "@/lib/custom-error";
import { ActionResponse } from "@/types";

interface PresignedUrlResponse {
  uploadUrl: string;
  objectKey: string;
}

class FileUploadAPIService {
  /**
   * Gets a presigned URL from our backend API.
   */
  private async getPresignedUrl(file: File): Promise<PresignedUrlResponse> {
    const response = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileType: file.type,
        fileSize: file.size,
      }),
    });

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

  /**
   * Uploads a single image by first getting a presigned URL, then PUT-ing the file to it.
   * @param file - The file to upload.
   * @returns A promise that resolves to the objectKey of the uploaded file.
   */
  async uploadImage(file: File): Promise<string> {
    try {
      // Step 1: Get the presigned URL from our own backend.
      const { uploadUrl, objectKey } = await this.getPresignedUrl(file);

      // Step 2: Use the presigned URL to upload the file directly to MinIO.
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        // This will catch the 403 Forbidden error if it's still happening
        throw new Error(
          `Direct upload to storage failed with status: ${uploadResponse.status}`
        );
      }

      return objectKey;
    } catch (error) {
      console.error("Image upload failed:", error);
      // Re-throw a user-friendly error
      throw new InternalServerError(
        "Could not upload the image. Please try again."
      );
    }
  }

  /**
   * Deletes an image from MinIO using its objectKey.
   */
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
