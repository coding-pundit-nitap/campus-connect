import { environment } from "@/config/env.config";

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
    } catch {
      // TODO: Loggind
      return fallbackKey;
    }
  };

  return {
    extractImageKey,
    getImageUrl,
    processImageKeyForSubmission,
  };
}
