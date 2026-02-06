import React from "react";

import { Products } from "./products";

type Props = {
  shop_id: string;
};

export default function Shops({ shop_id }: Props) {
  return (
    <div className="flex gap-4 flex-col justify-between flex-wrap h-full">
      <Products shop_id={shop_id} />
    </div>
  );
}
