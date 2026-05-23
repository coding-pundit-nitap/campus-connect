import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/serializers/response-serializer";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const buildings = await prisma.building.findMany({
      where: { is_active: true },
      orderBy: [{ name: "asc" }, { hostel_block: "asc" }],
    });

    return jsonResponse(
      createSuccessResponse(buildings, "Buildings fetched successfully"),
      200
    );
  } catch (error) {
    console.error("GET buildings error:", error);
    return jsonResponse(createErrorResponse("Failed to fetch buildings"), 500);
  }
}
