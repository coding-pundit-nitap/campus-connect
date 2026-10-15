import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

import { env } from "@/config/env.config";
import { createLogger } from "@/lib/logger";
const log = createLogger("route");

const s3Client = new S3Client({
  endpoint: env.MINIO_ENDPOINT!,
  region: env.AWS_REGION!,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

const BUCKET_NAME = env.NEXT_PUBLIC_MINIO_BUCKET || "campus-connect";

const SAFE_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const segments = (await params).path.slice(1);
  // Keys are plain "folder/name.ext": refuse anything that could walk out of
  // the bucket ("..", ".", empty segments, backslashes).
  if (
    segments.length === 0 ||
    segments.some(
      (s) => s === "" || s === "." || s === ".." || s.includes("\\")
    )
  ) {
    return new NextResponse("Invalid image path", { status: 400 });
  }
  const objectKey = segments.join("/");

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: objectKey,
    });

    const s3Response = await s3Client.send(command);

    if (!s3Response.Body) {
      throw new Error("S3 response body is empty.");
    }

    // Only raster images are rendered inline; anything else (SVG, HTML, ...)
    // could run script on our origin, so it is served as a download.
    const storedType = s3Response.ContentType ?? "";
    const isRasterImage = SAFE_IMAGE_TYPES.includes(storedType);
    const contentType = isRasterImage ? storedType : "application/octet-stream";

    const arrayBuffer = await s3Response.Body.transformToByteArray();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Security-Policy": "default-src 'none'; sandbox",
        ...(isRasterImage ? {} : { "Content-Disposition": "attachment" }),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Cross-Origin-Resource-Policy": "cross-origin",
        "Timing-Allow-Origin": "*",
      },
    });
  } catch (error) {
    if ((error as { name: string }).name === "NoSuchKey") {
      return new NextResponse("Image not found", { status: 404 });
    }
    log.error({ err: error }, "Error fetching image from MinIO:");
    return new NextResponse("Internal server error", { status: 500 });
  }
}
