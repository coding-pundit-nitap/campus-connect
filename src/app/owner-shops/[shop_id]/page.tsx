import React from "react";

import OwnedIndividualShopPage from "@/page-components/owner-shop/owned-individual-shop-page";

type Props = {
  params: Promise<{ shop_id: string }>;
};

export default async function Page({ params }: Props) {
  const { shop_id } = await params;

  return <OwnedIndividualShopPage shop_id={shop_id} />;
}
