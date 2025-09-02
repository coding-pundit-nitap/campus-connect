"use client";

import ShopCard from "@/components/homepage/shop-card";
import { useAllShops } from "@/hooks/tanstack/useShop";

export function Shops() {
  const { data: shops, isLoading, error } = useAllShops();

  if (isLoading) return <p>Loading shops...</p>;
  if (error) return <p>Failed to load shops</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 bg-blue lg:m-5 p-5">
      {shops?.pages.map((page) =>
        page.data.map((shop) => <ShopCard key={shop.id} shop={shop} />)
      )}
    </div>
  );
}
