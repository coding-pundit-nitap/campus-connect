import { NextResponse } from "next/server";

import { shopRepository } from "@/di/container";
import { UnauthenticatedError } from "@/lib/custom-error";
import authUtils from "@/lib/utils/auth.utils.server";
import { ActionResponse } from "@/types/response.types";

import { errorJson } from "./route-helpers";

export type VendorShopResult =
  | { shopId: string; error?: undefined }
  | { shopId?: undefined; error: NextResponse<ActionResponse<null>> };

/**
 * Resolves the signed-in vendor's shop id, or the response to return instead:
 * 401 when signed out (or without a user id), 403 when the user owns no
 * shop (not a vendor). Other errors thrown by authUtils / the repository propagate.
 */
export async function resolveVendorShop(): Promise<VendorShopResult> {
  let user;
  try {
    user = await authUtils.getUserData();
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return { error: errorJson("Unauthorized", 401) };
    }
    throw error;
  }
  if (!user.id) return { error: errorJson("Not authorized", 401) };

  const shop = await shopRepository.findByOwnerId(user.id, {
    select: { id: true },
  });
  if (!shop)
    return { error: errorJson("Forbidden: you don't own a shop", 403) };

  return { shopId: shop.id };
}
