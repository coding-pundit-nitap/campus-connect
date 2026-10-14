import axios from "axios";

import axiosInstance from "@/lib/axios";
import { createLogger } from "@/lib/logger";

import { apiPost } from "../api-client";
const log = createLogger("file-upload-api.service");

interface PresignedUrlResponse {
  presignedUrl: string;
  objectKey: string;
  publicUrl: string;
  expiresIn: number;
}

class FileUploadAPIService {
  async putToPreSignedUrl(
    file: File,
    presignedUrl: string,
    onProgress?: (percent: number) => void
  ) {
    await axios.put(presignedUrl, file, {
      headers: {
        "Content-Type": file.type,
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percent);
        }
      },
      timeout: 120_000, // 2 minutes
    });
  }

  async uploadImage(
    file: File,
    prefix?: string,
    onProgress?: (percent: number) => void
  ): Promise<string> {
    const { presignedUrl, objectKey } = await apiPost<PresignedUrlResponse>(
      "/upload",
      {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        prefix,
      }
    );

    await this.putToPreSignedUrl(file, presignedUrl, onProgress);

    return objectKey;
  }

  async deleteImage(objectKey: string): Promise<void> {
    try {
      await axiosInstance.delete("/upload", {
        data: { objectKey },
      });
    } catch (error) {
      log.error({ err: error }, "Image deletion failed:");
    }
  }
}

export const fileUploadAPIService = new FileUploadAPIService();
export default fileUploadAPIService;
