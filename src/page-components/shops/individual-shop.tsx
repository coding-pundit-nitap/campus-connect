import React from "react";

import Shops from "@/components/shops/shops";

type Props = {
  shop_id: string;
};

export default function IndividualShop({ shop_id }: Props) {
  return <Shops shop_id={shop_id} />;
}
