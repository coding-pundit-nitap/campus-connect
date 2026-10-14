import { NextResponse } from "next/server";

import { shopRepository } from "@/di/container";
import authUtils from "@/lib/utils/auth.utils.server";
import { ActionResponse } from "@/types/response.types";

import { errorJson } from "./route-helpers";

export type VendorShopResult =
  | { shopId: string; error?: undefined }
  | { shopId?: undefined; error: NextResponse<ActionResponse<null>> };

/**
 * Resolves the signed-in vendor's shop id, or the response to return instead:
 * 401 "Not authorized" without a user id, 400 "Shop not found" without a shop.
 * Errors thrown by authUtils / the repository propagate to the caller.
 */
export async function resolveVendorShop(): Promise<VendorShopResult> {
  const user = await authUtils.getUserData();
  if (!user.id) return { error: errorJson("Not authorized", 401) };

  const shop = await shopRepository.findByOwnerId(user.id, {
    select: { id: true },
  });
  if (!shop) return { error: errorJson("Shop not found", 400) };

  return { shopId: shop.id };
}
