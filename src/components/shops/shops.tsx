import React from "react";

import { Products } from "./products";
import { ShopDetails } from "./shop-details";

type Props = {
  shop_id: string;
};

export default function Shops({ shop_id }: Props) {
  return (
    <div className="flex h-full flex-col gap-4">
      <ShopDetails shop_id={shop_id} />
      <Products shop_id={shop_id} />
    </div>
  );
}
