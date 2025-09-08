import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { authUtils } from "@/lib/utils-functions";
import fileUploadService from "@/services/file-upload.service";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";

export const runtime = "edge";

const deleteSchema = z.object({
  objectKey: z.string().min(1, "Object key is required."),
});

export async function DELETE(request: NextRequest) {
  try {
    const isAuthenticated = await authUtils.isAuthenticated();
    if (!isAuthenticated) {
      return NextResponse.json(createErrorResponse("Unauthorized"), {
        status: 401,
      });
    }

    const body = await request.json();
    const validation = deleteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(createErrorResponse("Invalid input"), {
        status: 400,
      });
    }

    await fileUploadService.deleteFile(validation.data.objectKey);

    return NextResponse.json(
      createSuccessResponse(null, "File deleted successfully.")
    );
  } catch (error) {
    console.error("Delete File API Error:", error);
    return NextResponse.json(
      createErrorResponse("An unexpected error occurred."),
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const isAuthenticated = await authUtils.isAuthenticated();
    if (!isAuthenticated) {
      return NextResponse.json(createErrorResponse("Unauthorized"), {
        status: 401,
      });
    }

    const { fileType, fileSize } = await request.json();

    if (!fileType || !fileSize) {
      return NextResponse.json(
        createErrorResponse("fileType and fileSize are required."),
        { status: 400 }
      );
    }

    const data = await fileUploadService.createPresignedUploadUrl(
      fileType,
      fileSize
    );

    return NextResponse.json(
      createSuccessResponse(data, "Pre-signed URL created successfully.")
    );
  } catch (error) {
    console.error("Upload API Error:", error);
    return NextResponse.json(
      createErrorResponse("An unexpected error occurred."),
      { status: 500 }
    );
  }
}
