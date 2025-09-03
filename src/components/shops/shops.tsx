import React from "react";

import { ProductListContainer } from "./products/products";
import ShopDetails from "./shop-detail/shop-details";

type Props = {
  shop_id: string;
};

export default function Shops({ shop_id }: Props) {
  return (
    <div className="flex gap-2 flex-col justify-between flex-wrap ">
      <ShopDetails shop_id={shop_id} />
      <ProductListContainer shop_id={shop_id} />
    </div>
  );
}
