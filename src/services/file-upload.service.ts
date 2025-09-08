import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { BadRequestError } from "@/lib/custom-error";

interface UploadOptions {
  maxSizeInMB?: number;
  allowedTypes?: string[];
  prefix?: string;
}

class FileUploadService {
  // Client for SERVER -> MINIO communication (e.g., delete)
  private internalS3Client = new S3Client({
    endpoint: process.env.MINIO_ENDPOINT!,
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  });

  // Client specifically for generating presigned URLs for the BROWSER
  private publicS3Client = new S3Client({
    endpoint: process.env.NEXT_PUBLIC_MINIO_ENDPOINT!, // Use the public endpoint here
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  });

  private BUCKET_NAME = process.env.NEXT_PUBLIC_MINIO_BUCKET!;

  async createPresignedUploadUrl(
    fileType: string,
    fileSize: number,
    options: UploadOptions = {}
  ) {
    const {
      maxSizeInMB = 5,
      allowedTypes = ["image/jpeg", "image/png", "image/webp"],
      prefix = "general",
    } = options;

    // Validation logic remains the same...
    const maxSize = maxSizeInMB * 1024 * 1024;
    if (fileSize > maxSize) {
      throw new BadRequestError(
        `File size exceeds the ${maxSizeInMB}MB limit.`
      );
    }
    if (!allowedTypes.includes(fileType)) {
      throw new BadRequestError(
        "Invalid file type. Allowed types are: " + allowedTypes.join(", ")
      );
    }

    const fileExtension = `.${fileType.split("/")[1]}`;
    const objectKey = `${prefix}/${crypto.randomUUID()}${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: this.BUCKET_NAME,
      Key: objectKey,
      ContentType: fileType,
    });

    try {
      // --- THIS IS THE FIX ---
      // Use the publicS3Client to generate the URL.
      // This ensures the URL and its signature are created for the correct public hostname.
      const uploadUrl = await getSignedUrl(
        this.publicS3Client, // Use the client configured with the public endpoint
        command,
        {
          expiresIn: 300, // 5 minutes
        }
      );
      // --- END OF FIX ---

      console.log(
        "Generated correctly signed URL for browser:",
        uploadUrl.split("?")[0] + "?[SIGNED]"
      );

      return { uploadUrl, objectKey };
    } catch (error) {
      console.error("Error generating presigned URL:", error);
      throw new Error("Failed to generate upload URL");
    }
  }

  async deleteFile(objectKey: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.BUCKET_NAME,
        Key: objectKey,
      });

      // For server-side actions, use the internal client
      await this.internalS3Client.send(command);
      console.log(`File deleted from MinIO: ${objectKey}`);
    } catch (error) {
      console.error("Error deleting file from MinIO:", error);
      throw new Error(`Failed to delete file from MinIO: ${objectKey}`);
    }
  }
}

export const fileUploadService = new FileUploadService();
export default fileUploadService;
