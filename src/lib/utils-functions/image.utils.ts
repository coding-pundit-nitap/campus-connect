import { environment } from "@/config/env.config";

class ImageUtils {
  static extractImageKey(imageValue: string): string {
    const urlPrefix = environment.minioBaseUrl + "/";
    return imageValue.startsWith(urlPrefix)
      ? imageValue.replace(urlPrefix, "")
      : imageValue;
  }

  static getImageUrl(objectKey: string): string {
    return `${environment.minioBaseUrl}/${objectKey}`;
  }

  static processImageKeyForSubmission(
    formImageKey: string,
    fallbackKey: string
  ): string {
    try {
      return this.extractImageKey(formImageKey);
    } catch (error) {
      console.warn("Failed to extract image key, using fallback:", error);
      return fallbackKey;
    }
  }
}

export { ImageUtils };
