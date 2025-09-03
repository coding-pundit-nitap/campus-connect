import React from "react";

import IndividualShop from "@/page-components/shops/individual-shop";

type Props = {
  searchParams: Promise<{ shop_id: string }>;
};

export default async function Page({ searchParams }: Props) {
  const { shop_id } = await searchParams;

  return <IndividualShop shop_id={shop_id} />;
}
