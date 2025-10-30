import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { authUtils } from "@/lib/utils/auth.utils";
import { fileUploadService } from "@/services/file-upload";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";

const deleteSchema = z.object({
  objectKey: z.string().min(1, "Object key is required."),
});

const uploadSchema = z.object({
  fileName: z
    .string()
    .min(1, "File name is required")
    .max(255, "File name too long"),
  fileType: z.string().min(1, "File type is required"),
  fileSize: z
    .number()
    .positive("File size must be positive")
    .max(10 * 1024 * 1024, "File too large"),
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
      return NextResponse.json(
        createErrorResponse(
          "Invalid input: " + validation.error.issues[0].message
        ),
        { status: 400 }
      );
    }

    await fileUploadService.deleteFile(validation.data.objectKey);

    return NextResponse.json(
      createSuccessResponse(null, "File deleted successfully.")
    );
  } catch (error) {
    console.error("Delete File API Error:", error);
    return NextResponse.json(createErrorResponse("File deletion failed."), {
      status: 500,
    });
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

    const body = await request.json();
    const validation = uploadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse(
          "Invalid input: " + validation.error.issues[0].message
        ),
        { status: 400 }
      );
    }

    const { fileName, fileType, fileSize } = validation.data;

    const data = await fileUploadService.createPresignedUploadUrl(
      fileName,
      fileType,
      fileSize
    );

    return NextResponse.json(
      createSuccessResponse(data, "Pre-signed URL created successfully.")
    );
  } catch (error) {
    console.error("Upload API Error:", error);

    return NextResponse.json(
      createErrorResponse("Upload preparation failed."),
      { status: 500 }
    );
  }
}
