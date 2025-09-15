import React from "react";

import { ProductListContainer } from "./products";

type Props = {
  shop_id: string;
};

export default function Shops({ shop_id }: Props) {
  return (
    <div className="flex gap-2 flex-col justify-between flex-wrap h-full">
      <ProductListContainer shop_id={shop_id} />
    </div>
  );
}
