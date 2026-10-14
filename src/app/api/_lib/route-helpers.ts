import { NextResponse } from "next/server";
import { z } from "zod";

import { ShopType } from "@/generated/client";
import {
  ForbiddenError,
  UnauthenticatedError,
  UnauthorizedError,
} from "@/lib/custom-error";
import { jsonResponse } from "@/lib/serializers/response-serializer";
import { ActionResponse, createErrorResponse } from "@/types/response.types";

/** `jsonResponse(createErrorResponse(details), status)` in one call. */
export function errorJson(
  details: string,
  status: number
): NextResponse<ActionResponse<null>> {
  return jsonResponse(createErrorResponse(details), status);
}

/** 400 response listing every Zod issue message, comma separated. */
export function zodErrorResponse(error: z.ZodError) {
  return errorJson(error.issues.map((e) => e.message).join(", "), 400);
}

/**
 * Maps auth errors thrown by authUtils to 401 / 403 responses.
 * Returns null for any other error so the caller can fall through to 500.
 */
export function authErrorResponse(
  error: unknown,
  forbiddenMessage = "Forbidden"
) {
  if (error instanceof UnauthenticatedError) {
    return errorJson("Unauthorized", 401);
  }
  if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
    return errorJson(forbiddenMessage, 403);
  }
  return null;
}

/** The error's own message when it is an Error, otherwise the fallback. */
export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/** Reads the `type` query param as a ShopType filter ("ALL"/absent = none). */
export function parseShopTypeParam(
  searchParams: URLSearchParams
): ShopType | undefined {
  const typeParam = searchParams.get("type");
  return typeParam && typeParam !== "ALL" ? (typeParam as ShopType) : undefined;
}
