import sharp from "sharp";

export const IMAGE_SIZES = {
  OG: { width: 1200, height: 630, quality: 90 },
  DETAIL: { width: 1200, height: null, quality: 90 },
  THUMBNAIL: { width: 400, height: 400, quality: 85 },
  MOBILE: { width: 800, height: null, quality: 85 },
} as const;

export interface OptimizeOptions {
  width?: number | null;
  height?: number | null;
  quality?: number;
  fit?: "cover" | "contain" | "inside" | "outside";
}

export async function optimizeImage(
  buffer: Buffer,
  options: OptimizeOptions = {}
): Promise<Buffer> {
  const { width = 1200, height = null, quality = 90, fit = "inside" } = options;

  try {
    const image = sharp(buffer);

    const metadata = await image.metadata();

    if (
      metadata.width &&
      width &&
      metadata.width <= width &&
      metadata.format === "jpeg"
    ) {
      return await image.jpeg({ quality, mozjpeg: true }).toBuffer();
    }

    let processedImage = image;

    if (width || height) {
      processedImage = processedImage.resize(width, height as number, {
        fit,
        position: "center",
        withoutEnlargement: true,
      });
    }

    return await processedImage
      .jpeg({
        quality,
        mozjpeg: true,
        progressive: true,
      })
      .toBuffer();
  } catch (error) {
    console.error("Image optimization error:", error);
    return buffer;
  }
}

export async function optimizeForOpenGraph(buffer: Buffer): Promise<Buffer> {
  return optimizeImage(buffer, {
    width: IMAGE_SIZES.OG.width,
    height: IMAGE_SIZES.OG.height,
    quality: IMAGE_SIZES.OG.quality,
    fit: "cover",
  });
}

export async function optimizeForProductDetail(
  buffer: Buffer
): Promise<Buffer> {
  return optimizeImage(buffer, {
    width: IMAGE_SIZES.DETAIL.width,
    height: IMAGE_SIZES.DETAIL.height,
    quality: IMAGE_SIZES.DETAIL.quality,
    fit: "inside",
  });
}

export async function optimizeForThumbnail(buffer: Buffer): Promise<Buffer> {
  return optimizeImage(buffer, {
    width: IMAGE_SIZES.THUMBNAIL.width,
    height: IMAGE_SIZES.THUMBNAIL.height,
    quality: IMAGE_SIZES.THUMBNAIL.quality,
    fit: "cover",
  });
}

export async function optimizeForMobile(buffer: Buffer): Promise<Buffer> {
  return optimizeImage(buffer, {
    width: IMAGE_SIZES.MOBILE.width,
    height: IMAGE_SIZES.MOBILE.height,
    quality: IMAGE_SIZES.MOBILE.quality,
    fit: "inside",
  });
}

export async function getImageMetadata(buffer: Buffer) {
  try {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: buffer.length,
      hasAlpha: metadata.hasAlpha,
    };
  } catch (error) {
    console.error("Failed to get image metadata:", error);
    return null;
  }
}

export function getCompressionRatio(
  originalSize: number,
  optimizedSize: number
): number {
  return Math.round(((originalSize - optimizedSize) / originalSize) * 100);
}

export async function isValidImage(buffer: Buffer): Promise<boolean> {
  try {
    await sharp(buffer).metadata();
    return true;
  } catch {
    return false;
  }
}

export async function convertToWebP(
  buffer: Buffer,
  quality = 85
): Promise<Buffer> {
  try {
    return await sharp(buffer).webp({ quality, effort: 6 }).toBuffer();
  } catch (error) {
    console.error("WebP conversion error:", error);
    return buffer;
  }
}
