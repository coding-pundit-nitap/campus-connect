"use client";
import React from "react";

import OwnedShop from "@/components/owned-shop/owned-shop";

type Props = {
  shop_id: string;
};

export default function OwnedShopPage({ shop_id }: Props) {
  return <OwnedShop shop_id={shop_id} />;
}
