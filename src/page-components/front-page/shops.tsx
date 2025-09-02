"use client";

import { useShopByUser } from "@/hooks/tanstack/useShopProducts"; // adjust path if needed

export function Shops() {
  const { isLoading, error } = useShopByUser();

  if (isLoading) return <p>Loading shops...</p>;
  if (error) return <p>Failed to load shops</p>;

  return (
    <></>
    // <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 bg-blue lg:m-5 p-5">

    // </div>
  );
}
