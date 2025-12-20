import React from "react";

import { BackButton } from "@/components/shared/back-button";
import Shops from "@/components/shops/shops";

type Props = {
  shop_id: string;
};

export default function IndividualShop({ shop_id }: Props) {
  return (
    <div className="container py-6 space-y-4">
      <BackButton href="/shops" label="Back to Shops" />
      <Shops shop_id={shop_id} />
    </div>
  );
}
