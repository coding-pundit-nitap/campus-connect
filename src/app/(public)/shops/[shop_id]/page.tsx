import React from "react";

import IndividualShop from "@/page-components/shops/individual-shop";

type Props = {
  params: Promise<{ shop_id: string }>;
};

export default async function Page({ params }: Props) {
  const { shop_id } = await params;

  return <IndividualShop shop_id={shop_id} />;
}
