"use server";

import { UnauthorizedError } from "@/lib/custom-error";
import { prisma } from "@/lib/prisma";
import { authUtils } from "@/lib/utils/auth.utils.server";
import { createSuccessResponse } from "@/types/response.types";

export async function toggleShopStatusAction(shop_id: string) {
  const user = await authUtils.getUserData();
  if (!user || user.shop_id !== shop_id) {
    throw new UnauthorizedError("You are not authorized to modify this shop.");
  }

  const shop = await prisma.shop.findUnique({
    where: { id: shop_id },
    select: { is_active: true },
  });

  if (!shop) {
    throw new Error("Shop not found.");
  }

  const updatedShop = await prisma.shop.update({
    where: { id: shop_id },
    data: { is_active: !shop.is_active },
    select: { id: true, is_active: true },
  });

  return createSuccessResponse(
    updatedShop,
    updatedShop.is_active ? "Shop is now open" : "Shop is now closed"
  );
}
