import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { BadRequestError } from "@/lib/custom-error";
import {
  getCompressionRatio,
  getImageMetadata,
  isValidImage,
  optimizeForProductDetail,
} from "@/lib/utils/image-optimizer";

export interface UploadOptions {
  maxSizeInMB?: number;
  allowedTypes?: string[];
  prefix?: string;
}

const SECURE_FILE_TYPES: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
  "application/pdf": [".pdf"],
  "text/plain": [".txt"],
};

const DANGEROUS_EXTENSIONS = [
  ".exe",
  ".bat",
  ".cmd",
  ".com",
  ".pif",
  ".scr",
  ".vbs",
  ".js",
  ".jar",
  ".app",
  ".deb",
  ".pkg",
  ".dmg",
  ".rpm",
  ".msi",
  ".dll",
  ".so",
  ".dylib",
  ".php",
  ".asp",
  ".aspx",
  ".jsp",
  ".py",
  ".rb",
  ".pl",
  ".sh",
  ".ps1",
];

class FileUploadService {
  // Client for SERVER -> MINIO communication
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
    endpoint: process.env.NEXT_PUBLIC_MINIO_ENDPOINT!,
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  });

  private BUCKET_NAME = process.env.NEXT_PUBLIC_MINIO_BUCKET!;

  private validateFileSecurity(
    fileName: string,
    fileType: string,
    fileSize: number,
    options: UploadOptions
  ): void {
    const {
      maxSizeInMB = 5,
      allowedTypes = ["image/jpeg", "image/png", "image/webp"],
    } = options;

    // File size validation
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

    const extension = fileName
      .toLowerCase()
      .substring(fileName.lastIndexOf("."));

    // Check for dangerous extensions
    if (DANGEROUS_EXTENSIONS.includes(extension)) {
      throw new BadRequestError("File type not allowed for security reasons");
    }

    // Validate extension matches MIME type
    const allowedExtensions = SECURE_FILE_TYPES[fileType];
    if (allowedExtensions && !allowedExtensions.includes(extension)) {
      throw new BadRequestError(
        `File extension ${extension} does not match declared type ${fileType}`
      );
    }

    // Check for double extensions (potential bypass attempt)
    const parts = fileName.split(".");
    if (parts.length > 2) {
      const secondLastExtension = "." + parts[parts.length - 2].toLowerCase();
      if (DANGEROUS_EXTENSIONS.includes(secondLastExtension)) {
        throw new BadRequestError("File contains dangerous double extension");
      }
    }

    // Check for null bytes (directory traversal attempt)
    if (fileName.includes("\0") || fileName.includes("%00")) {
      throw new BadRequestError("Invalid file name contains null bytes");
    }

    // Check for path traversal attempts
    if (
      fileName.includes("../") ||
      fileName.includes("..\\") ||
      fileName.includes("/")
    ) {
      throw new BadRequestError(
        "Invalid file name contains path traversal sequences"
      );
    }
  }

  private generateSecureFileName(
    originalFileName: string,
    prefix: string
  ): string {
    const extension = originalFileName
      .toLowerCase()
      .substring(originalFileName.lastIndexOf("."));
    const randomName = crypto.randomUUID();
    return `${prefix}/${randomName}${extension}`;
  }

  async upload(
    fileName: string,
    fileType: string,
    fileSize: number,
    fileBuffer: Buffer,
    options: UploadOptions = {}
  ): Promise<string> {
    const { prefix = "general" } = options;

    this.validateFileSecurity(fileName, fileType, fileSize, options);

    const objectKey = this.generateSecureFileName(fileName, prefix);

    const command = new PutObjectCommand({
      Bucket: this.BUCKET_NAME,
      Key: objectKey,
      Body: fileBuffer,
      ContentType: fileType,
      Metadata: {
        "original-filename": Buffer.from(fileName).toString("base64"),
        "upload-timestamp": new Date().toISOString(),
      },
      CacheControl: "no-cache, no-store, must-revalidate",
    });

    try {
      await this.internalS3Client.send(command);
      return objectKey;
    } catch (error) {
      console.error("Error uploading to MinIO:", error);
      throw new Error("Failed to upload file to MinIO");
    }
  }

  async uploadOptimizedImage(
    fileName: string,
    fileType: string,
    fileSize: number,
    fileBuffer: Buffer,
    options: UploadOptions = {}
  ): Promise<{
    key: string;
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
  }> {
    const { prefix = "general" } = options;

    this.validateFileSecurity(fileName, fileType, fileSize, options);

    const isImage = await isValidImage(fileBuffer);
    if (!isImage) {
      throw new BadRequestError("File is not a valid image");
    }

    const originalMetadata = await getImageMetadata(fileBuffer);
    console.log("Original image:", {
      size: `${(fileSize / 1024).toFixed(2)} KB`,
      dimensions: `${originalMetadata?.width}x${originalMetadata?.height}`,
      format: originalMetadata?.format,
    });

    const optimizedBuffer = await optimizeForProductDetail(fileBuffer);
    const optimizedMetadata = await getImageMetadata(optimizedBuffer);

    const compressionRatio = getCompressionRatio(
      fileSize,
      optimizedBuffer.length
    );

    console.log("Optimized image:", {
      size: `${(optimizedBuffer.length / 1024).toFixed(2)} KB`,
      dimensions: `${optimizedMetadata?.width}x${optimizedMetadata?.height}`,
      compressionRatio: `${compressionRatio}%`,
      savedBytes: `${((fileSize - optimizedBuffer.length) / 1024).toFixed(2)} KB`,
    });

    const objectKey = this.generateSecureFileName(fileName, prefix);

    const command = new PutObjectCommand({
      Bucket: this.BUCKET_NAME,
      Key: objectKey,
      Body: optimizedBuffer,
      ContentType: "image/jpeg",
      Metadata: {
        "original-filename": Buffer.from(fileName).toString("base64"),
        "upload-timestamp": new Date().toISOString(),
        "original-size": fileSize.toString(),
        "optimized-size": optimizedBuffer.length.toString(),
        "compression-ratio": compressionRatio.toString(),
        "original-dimensions": `${originalMetadata?.width}x${originalMetadata?.height}`,
      },
      CacheControl: "public, max-age=31536000, immutable",
    });

    try {
      await this.internalS3Client.send(command);
      return {
        key: objectKey,
        originalSize: fileSize,
        optimizedSize: optimizedBuffer.length,
        compressionRatio,
      };
    } catch (error) {
      console.error("Error uploading optimized image to MinIO:", error);
      throw new Error("Failed to upload optimized image to MinIO");
    }
  }

  async createPresignedUploadUrl(
    fileName: string,
    fileType: string,
    fileSize: number,
    options: UploadOptions = {}
  ) {
    const { prefix = "general" } = options;

    this.validateFileSecurity(fileName, fileType, fileSize, options);

    const objectKey = this.generateSecureFileName(fileName, prefix);

    const command = new PutObjectCommand({
      Bucket: this.BUCKET_NAME,
      Key: objectKey,
      ContentType: fileType,
      Metadata: {
        "original-filename": Buffer.from(fileName).toString("base64"),
        "upload-timestamp": new Date().toISOString(),
      },
      CacheControl: "no-cache, no-store, must-revalidate",
    });

    try {
      const uploadUrl = await getSignedUrl(this.publicS3Client, command, {
        expiresIn: 300, // 5 minutes
      });

      return { uploadUrl, objectKey };
    } catch (error) {
      console.error("Error generating presigned URL:", error);
      throw new Error("Failed to generate upload URL");
    }
  }

  async deleteFile(objectKey: string): Promise<void> {
    try {
      if (objectKey.includes("../") || objectKey.includes("..\\")) {
        throw new BadRequestError(
          "Invalid object key contains path traversal sequences"
        );
      }

      const command = new DeleteObjectCommand({
        Bucket: this.BUCKET_NAME,
        Key: objectKey,
      });

      await this.internalS3Client.send(command);
    } catch (error) {
      console.error("Error deleting file from MinIO:", error);
      throw new Error(`Failed to delete file from MinIO: ${objectKey}`);
    }
  }
}

export const fileUploadService = new FileUploadService();
export default fileUploadService;
