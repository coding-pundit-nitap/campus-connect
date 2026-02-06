import { NextRequest, NextResponse } from "next/server";

import { createErrorResponse } from "@/types/response.types";

export async function POST(request: NextRequest) {
  try {
    void request;
    return NextResponse.json(
      createErrorResponse(
        "Registration is disabled. Please use Google sign-in from the login dialog."
      ),
      { status: 410 }
    );
  } catch (error) {
    console.error("REGISTRATION ERROR:", error);
    const errorResponse = createErrorResponse(
      "An internal server error occurred."
    );
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
