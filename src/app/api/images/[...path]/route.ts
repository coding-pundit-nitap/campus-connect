import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

const s3Client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT!,
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

const BUCKET_NAME = process.env.NEXT_PUBLIC_MINIO_BUCKET || "campus-connect";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const objectKey = (await params).path.slice(1).join("/");

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: objectKey,
    });

    const s3Response = await s3Client.send(command);

    if (!s3Response.Body) {
      throw new Error("S3 response body is empty.");
    }

    const contentType = s3Response.ContentType ?? "application/octet-stream";

    const arrayBuffer = await s3Response.Body.transformToByteArray();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
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
    console.error("Error fetching image from MinIO:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
