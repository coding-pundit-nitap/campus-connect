import { useMemo } from "react";

import { ShopWithOwner } from "@/types";

import { useAllShops } from "./tanstack";

export const useShops = () => {
  const {
    data,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useAllShops();

  const allShops: ShopWithOwner[] = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data]);

  const isEmpty = allShops.length === 0;

  const isOpen = useMemo(
    () => (shop: ShopWithOwner) => {
      const now = new Date();
      const currentTime = now.getHours() * 100 + now.getMinutes();
      const openTime = parseInt(shop.opening.replace(":", ""));
      const closeTime = parseInt(shop.closing.replace(":", ""));

      if (closeTime > openTime) {
        return currentTime >= openTime && currentTime <= closeTime;
      } else {
        return currentTime >= openTime || currentTime <= closeTime;
      }
    },
    []
  );

  const formatTime = useMemo(
    () => (time: string) => {
      const [hours, minutes] = time.split(":");
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    },
    []
  );

  return {
    // Shop data
    allShops,
    isEmpty,

    // Loading states
    isLoading,
    isError,
    error,

    // Pagination
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,

    // Shop utilities
    isOpen,
    formatTime,
  };
};
