import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/serializers/response-serializer";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { shop_id: string } }
) {
  try {
    const { shop_id } = params;

    const deliveryBuildings = await prisma.shopDeliveryBuilding.findMany({
      where: {
        shop_id,
        is_active: true,
        building: { is_active: true },
      },
      include: { building: true },
      orderBy: [{ building: { name: "asc" } }],
    });

    return jsonResponse(
      createSuccessResponse(
        deliveryBuildings.map((db) => db.building),
        "Shop delivery buildings fetched successfully"
      ),
      200
    );
  } catch (error) {
    console.error("GET shop delivery buildings error:", error);
    return jsonResponse(
      createErrorResponse("Failed to fetch delivery buildings"),
      500
    );
  }
}
