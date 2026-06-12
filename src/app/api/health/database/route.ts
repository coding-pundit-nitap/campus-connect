import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/serializers/response-serializer";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";
const log = createLogger("route");

export async function GET() {
  const startTime = performance.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency = performance.now() - startTime;

    const response = createSuccessResponse(
      {
        status: "healthy",
        latency: Math.round(latency),
      },
      "Database connection is healthy."
    );
    return jsonResponse(response, 200);
  } catch (error) {
    log.error({ err: error }, "Database health check failed:");
    const response = createErrorResponse("Database is not accessible");
    return jsonResponse(response, 503);
  }
}
