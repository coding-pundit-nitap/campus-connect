import { NextRequest } from "next/server";

import { createLogger } from "@/lib/logger";
import { jsonResponse } from "@/lib/serializers/response-serializer";
import { createErrorResponse } from "@/types/response.types";
const log = createLogger("route");

export async function POST(request: NextRequest) {
  try {
    void request;
    return jsonResponse(
      createErrorResponse(
        "Registration is disabled. Please use Google sign-in from the login dialog."
      ),
      410
    );
  } catch (error) {
    log.error({ err: error }, "REGISTRATION ERROR:");
    const errorResponse = createErrorResponse(
      "An internal server error occurred."
    );
    return jsonResponse(errorResponse, 500);
  }
}
