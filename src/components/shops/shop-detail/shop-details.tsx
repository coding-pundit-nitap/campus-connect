"use client";
import React from "react";

import { SharedCard } from "@/components/shared/shared-card";
import { useShop } from "@/hooks";

type Props = {
  shop_id: string;
};

export default function ShopDetails({ shop_id }: Props) {
  const { data, isLoading, error } = useShop(shop_id);

  if (isLoading) {
    return <SharedCard>Loading shop details...</SharedCard>;
  }

  if (error) {
    return <SharedCard>Error loading shop: {error.message}</SharedCard>;
  }

  return <SharedCard>{data?.name || "Shop not found"}</SharedCard>;
}
