import { NextRequest } from "next/server";
import { z } from "zod";

import { jsonResponse } from "@/lib/serializers/response-serializer";
import { authUtils } from "@/lib/utils/auth.utils.server";
import { fileUploadService } from "@/services/file-upload/file-upload.service";
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
  prefix: z.string().optional(),
});

export async function DELETE(request: NextRequest) {
  try {
    const isAuthenticated = await authUtils.isAuthenticated();
    if (!isAuthenticated) {
      return jsonResponse(createErrorResponse("Unauthorized"), 401);
    }

    const body = await request.json();
    const validation = deleteSchema.safeParse(body);

    if (!validation.success) {
      return jsonResponse(
        createErrorResponse(
          "Invalid input: " + validation.error.issues[0].message
        ),
        400
      );
    }

    await fileUploadService.deleteFile(validation.data.objectKey);

    return jsonResponse(
      createSuccessResponse(null, "File deleted successfully."),
      200
    );
  } catch (error) {
    console.error("Delete File API Error:", error);
    return jsonResponse(createErrorResponse("File deletion failed."), 500);
  }
}

export async function POST(request: Request) {
  try {
    const isAuthenticated = await authUtils.isAuthenticated();
    if (!isAuthenticated) {
      return jsonResponse(createErrorResponse("Unauthorized"), 401);
    }

    const body = await request.json();
    const validation = uploadSchema.safeParse(body);

    if (!validation.success) {
      return jsonResponse(
        createErrorResponse(
          "Invalid input: " + validation.error.issues[0].message
        ),
        400
      );
    }

    const { fileName, fileType, fileSize, prefix } = validation.data;

    const data = await fileUploadService.createPresignedUploadUrl(
      fileName,
      fileType,
      fileSize,
      {
        prefix,
      }
    );

    return jsonResponse(
      createSuccessResponse(data, "Pre-signed URL created successfully."),
      200
    );
  } catch (error) {
    console.error("Upload API Error:", error);
    return jsonResponse(createErrorResponse("Upload preparation failed."), 500);
  }
}
