import { NextRequest, NextResponse } from "next/server";

import authUtils from "@/lib/utils-functions/auth.utils";
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
    const shop = await shopRepository.findByOwnerId(user_id, {
      include: { owner: { select: { name: true, email: true } } },
    });

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
