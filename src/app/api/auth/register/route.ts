import { NextRequest } from "next/server";

import { jsonResponse } from "@/lib/serializers/response-serializer";
import { createErrorResponse } from "@/types/response.types";

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
    console.error("REGISTRATION ERROR:", error);
    const errorResponse = createErrorResponse(
      "An internal server error occurred."
    );
    return jsonResponse(errorResponse, 500);
  }
}
