"use server";

import { redirect } from "next/navigation";

export async function navigateToShop(shopId: string) {
  redirect(`/shops/${shopId}`);
}

export async function navigateToProduct(productId: string, shopId?: string) {
  if (shopId) {
    redirect(`/shops/${shopId}/products/${productId}`);
  } else {
    redirect(`/products/${productId}`);
  }
}

export async function handleSearchNavigation(
  type: string,
  id: string,
  shopId?: string
) {
  if (type === "shop") {
    await navigateToShop(id);
  } else if (type === "product") {
    await navigateToProduct(id, shopId);
  }
}
