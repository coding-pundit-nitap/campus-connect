import { environment } from "@/config/env.config";

/**
 * Custom hook for extracting image keys from MinIO URLs
 * Handles conversion between full URLs and object keys
 */
export function useImageKeyExtractor() {
  const extractImageKey = (imageValue: string): string => {
    const urlPrefix = environment.minioBaseUrl + "/";
    return imageValue.startsWith(urlPrefix)
      ? imageValue.replace(urlPrefix, "")
      : imageValue;
  };
  const getImageUrl = (objectKey: string): string => {
    return `${environment.minioBaseUrl}/${objectKey}`;
  };
  const processImageKeyForSubmission = (
    formImageKey: string,
    fallbackKey: string
  ): string => {
    try {
      return extractImageKey(formImageKey);
    } catch (error) {
      console.warn("Failed to extract image key, using fallback:", error);
      return fallbackKey;
    }
  };

  return {
    extractImageKey,
    getImageUrl,
    processImageKeyForSubmission,
  };
}
