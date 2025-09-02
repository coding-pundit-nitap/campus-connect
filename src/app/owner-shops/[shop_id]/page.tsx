import React from "react";

import OwnedShopPage from "@/page-components/shop/owned-shop-page";

type Props = {
  params: Promise<{ shop_id: string }>;
};

export default async function Page({ params }: Props) {
  const { shop_id } = await params;

  return <OwnedShopPage shop_id={shop_id} />;
}
