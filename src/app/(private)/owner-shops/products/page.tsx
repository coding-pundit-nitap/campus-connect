import React from "react";

import authUtils from "@/lib/utils/auth.utils.server";
import OwnedIndividualShopPage from "@/page-components/owner-shop/owned-individual-shop-page";

export default async function Page() {
  const shop_id = await authUtils.getOwnedShopId();

  return <OwnedIndividualShopPage shop_id={shop_id} />;
}
