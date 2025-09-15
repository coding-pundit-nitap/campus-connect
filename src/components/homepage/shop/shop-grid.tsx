import React from "react";

import { ShopWithOwnerDetails } from "@/lib/shop-utils";

type Props = {
  shops: ShopWithOwnerDetails[];
  lastElementRef?: (node: HTMLDivElement | null) => void;
  renderShopCard: (
    product: ShopWithOwnerDetails,
    index: number,
    isLastProduct: boolean,
    isNearEnd: boolean
  ) => React.ReactNode;
};

export default function ShopGrid({
  shops,
  lastElementRef,
  renderShopCard,
}: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {shops.map((shop, index) => {
        const isLastProduct = index === shops.length - 1;
        const isNearEnd = index >= shops.length - 3;

        return (
          <div
            key={shop.id}
            ref={isLastProduct ? lastElementRef : undefined}
            className={isNearEnd ? "scroll-trigger" : ""}
          >
            {renderShopCard(shop, index, isLastProduct, isNearEnd)}
          </div>
        );
      })}
    </div>
  );
}
