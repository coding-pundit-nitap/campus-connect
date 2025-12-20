import { forbidden } from "next/navigation";
import React from "react";

import authUtils from "@/lib/utils/auth.utils.server";
import CreateProductPage from "@/page-components/owner-shop/create-product-page";

export const metadata = {
  title: "Add New Product",
  description: "Create a new product for your shop",
};

export default async function Page() {
  const shop_id = await authUtils.getOwnedShopId();

  if (!shop_id) {
    return forbidden();
  }

  return <CreateProductPage />;
}
