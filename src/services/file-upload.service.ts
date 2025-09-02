/**
 * File upload utility service
 * This service can be extended to integrate with cloud storage providers
 * like AWS S3, Cloudinary, or Firebase Storage
 */

export interface UploadResult {
  url: string;
  fileName: string;
  size: number;
}

export interface UploadOptions {
  maxSize?: number; // in MB
  allowedTypes?: string[];
  folder?: string;
}

class FileUploadService {
  /**
   * Simulated file upload - replace with actual cloud storage integration
   * @param file - The file to upload
   * @param options - Upload configuration options
   * @returns Promise with upload result
   */
  async uploadFile(
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const { maxSize = 5, allowedTypes = ["image/*"] } = options;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      throw new Error(`File size must be less than ${maxSize}MB`);
    }

    // Validate file type
    const isValidType = allowedTypes.some((type) => {
      if (type.endsWith("*")) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });

    if (!isValidType) {
      throw new Error(
        `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`
      );
    }

    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // For now, create a local URL (in production, this would be a cloud storage URL)
    const url = URL.createObjectURL(file);

    return {
      url,
      fileName: file.name,
      size: file.size,
    };
  }

  /**
   * Upload multiple files
   * @param files - Array of files to upload
   * @param options - Upload configuration options
   * @returns Promise with array of upload results
   */
  async uploadFiles(
    files: File[],
    options: UploadOptions = {}
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, options));
    return Promise.all(uploadPromises);
  }

  /**
   * Delete a file (for future implementation)
   * @param url - URL of the file to delete
   */
  async deleteFile(url: string): Promise<void> {
    // Implementation would depend on your storage provider
    console.log("Deleting file:", url);
  }
}

export const fileUploadService = new FileUploadService();
export default fileUploadService;
