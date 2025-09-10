import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { BadRequestError } from "@/lib/custom-error";
import { SecurityEventType,securityLogger } from "@/lib/security-logger";

interface UploadOptions {
  maxSizeInMB?: number;
  allowedTypes?: string[];
  prefix?: string;
}

/**
 * Secure file type validation
 * Maps MIME types to allowed file extensions to prevent type confusion attacks
 */
const SECURE_FILE_TYPES: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
  "application/pdf": [".pdf"],
  "text/plain": [".txt"],
};

/**
 * Dangerous file extensions that should never be allowed
 */
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
    endpoint: process.env.NEXT_PUBLIC_MINIO_ENDPOINT!,
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  });

  private BUCKET_NAME = process.env.NEXT_PUBLIC_MINIO_BUCKET!;

  /**
   * Validates file security constraints
   */
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
      securityLogger.logViolation(
        SecurityEventType.FILE_UPLOAD_VIOLATION,
        `File size exceeds limit: ${fileSize} bytes > ${maxSize} bytes`,
        undefined,
        undefined,
        { fileName, fileType, fileSize, maxSize }
      );
      throw new BadRequestError(
        `File size exceeds the ${maxSizeInMB}MB limit.`
      );
    }

    // MIME type validation
    if (!allowedTypes.includes(fileType)) {
      securityLogger.logViolation(
        SecurityEventType.FILE_UPLOAD_VIOLATION,
        `Invalid file type: ${fileType}`,
        undefined,
        undefined,
        { fileName, fileType, allowedTypes }
      );
      throw new BadRequestError(
        "Invalid file type. Allowed types are: " + allowedTypes.join(", ")
      );
    }

    // File extension validation
    const extension = fileName
      .toLowerCase()
      .substring(fileName.lastIndexOf("."));

    // Check for dangerous extensions
    if (DANGEROUS_EXTENSIONS.includes(extension)) {
      securityLogger.logViolation(
        SecurityEventType.FILE_UPLOAD_VIOLATION,
        `Dangerous file extension detected: ${extension}`,
        undefined,
        undefined,
        { fileName, fileType, extension }
      );
      throw new BadRequestError("File type not allowed for security reasons");
    }

    // Validate extension matches MIME type
    const allowedExtensions = SECURE_FILE_TYPES[fileType];
    if (allowedExtensions && !allowedExtensions.includes(extension)) {
      securityLogger.logViolation(
        SecurityEventType.FILE_UPLOAD_VIOLATION,
        `File extension mismatch: ${extension} does not match ${fileType}`,
        undefined,
        undefined,
        { fileName, fileType, extension, allowedExtensions }
      );
      throw new BadRequestError(
        `File extension ${extension} does not match declared type ${fileType}`
      );
    }

    // Check for double extensions (potential bypass attempt)
    const parts = fileName.split(".");
    if (parts.length > 2) {
      const secondLastExtension = "." + parts[parts.length - 2].toLowerCase();
      if (DANGEROUS_EXTENSIONS.includes(secondLastExtension)) {
        securityLogger.logViolation(
          SecurityEventType.FILE_UPLOAD_VIOLATION,
          `Dangerous double extension detected: ${secondLastExtension}`,
          undefined,
          undefined,
          { fileName, fileType, secondLastExtension }
        );
        throw new BadRequestError("File contains dangerous double extension");
      }
    }

    // Check for null bytes (directory traversal attempt)
    if (fileName.includes("\0") || fileName.includes("%00")) {
      securityLogger.logViolation(
        SecurityEventType.PATH_TRAVERSAL_ATTEMPT,
        `Null bytes detected in filename: ${fileName}`,
        undefined,
        undefined,
        { fileName, fileType }
      );
      throw new BadRequestError("Invalid file name contains null bytes");
    }

    // Check for path traversal attempts
    if (
      fileName.includes("../") ||
      fileName.includes("..\\") ||
      fileName.includes("/")
    ) {
      securityLogger.logViolation(
        SecurityEventType.PATH_TRAVERSAL_ATTEMPT,
        `Path traversal attempt in filename: ${fileName}`,
        undefined,
        undefined,
        { fileName, fileType }
      );
      throw new BadRequestError(
        "Invalid file name contains path traversal sequences"
      );
    }
  }

  /**
   * Generates a secure, random filename while preserving the extension
   */
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

  async createPresignedUploadUrl(
    fileName: string,
    fileType: string,
    fileSize: number,
    options: UploadOptions = {}
  ) {
    const { prefix = "general" } = options;

    // Validate file security
    this.validateFileSecurity(fileName, fileType, fileSize, options);

    // Generate secure object key
    const objectKey = this.generateSecureFileName(fileName, prefix);

    const command = new PutObjectCommand({
      Bucket: this.BUCKET_NAME,
      Key: objectKey,
      ContentType: fileType,
      // Additional security headers
      Metadata: {
        "original-filename": Buffer.from(fileName).toString("base64"),
        "upload-timestamp": new Date().toISOString(),
      },
      // Prevent caching of upload URLs
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
      // Validate object key to prevent path traversal
      if (objectKey.includes("../") || objectKey.includes("..\\")) {
        securityLogger.logViolation(
          SecurityEventType.PATH_TRAVERSAL_ATTEMPT,
          `Path traversal attempt in object key: ${objectKey}`,
          undefined,
          undefined,
          { objectKey }
        );
        throw new Error("Invalid object key contains path traversal sequences");
      }

      const command = new DeleteObjectCommand({
        Bucket: this.BUCKET_NAME,
        Key: objectKey,
      });

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
