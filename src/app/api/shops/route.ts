import { NextRequest, NextResponse } from "next/server";

import authUtils from "@/lib/utils/auth.utils";
import { shopRepository } from "@/repositories";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";

export async function GET(_request: NextRequest) {
  try {
    const user_id = await authUtils.getUserId();
    if (!user_id) {
      return NextResponse.json(createErrorResponse("User not authenticated"), {
        status: 401,
      });
    }
    const shopWithUser = await shopRepository.findByOwnerId(user_id, {
      include: { user: { select: { name: true, email: true } } },
    });

    if (!shopWithUser) {
      return NextResponse.json(createSuccessResponse(null, "Shop not found"), {
        status: 200,
      });
    }

    const { user, ...shopData } = shopWithUser;
    const shop = {
      ...shopData,
      user: user
        ? { name: user.name, email: user.email }
        : { name: "Unknown", email: "Unknown" },
    };

    const successResponse = createSuccessResponse(
      shop,
      "Shop fetched successfully"
    );
    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    console.error("GET SHOPS ERROR:", error);
    const errorResponse = createErrorResponse("Internal Server Error");
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
