import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";

export const config = {
  runtime: "edge",
};

export async function GET() {
  const startTime = performance.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    const latency = performance.now() - startTime;

    const successResponse = createSuccessResponse(
      {
        latency: Math.round(latency),
        timestamp: new Date().toISOString(),
        status: "healthy",
      },
      "Database is accessible"
    );

    return NextResponse.json(successResponse);
  } catch (error) {
    console.error("Database health check failed:", error);

    const errorResponse = createErrorResponse("Database is not accessible");

    return NextResponse.json(errorResponse, { status: 503 });
  }
}
