"use client";

import ShopCard from "@/components/service/shop-card";
import shopsList from "@/components/service/demo";

export default function Shops() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 bg-blue lg:m-5 p-5">
      {shopsList.map((shop: any) => (
        <ShopCard
          image={shop.image}
          key={shop.id}
          shopName={shop.name}
          shopDescription={shop.description}
          ratings={shop.rating}
          address={shop.address}
          openingHours={shop.openingHours}
          distance={shop.distance}
        />
      ))}
    </div>
  );
}
