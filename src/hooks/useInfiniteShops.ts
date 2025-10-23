"use client";
import { useMemo } from "react";

import { formatShopData, ShopWithOwnerDetails } from "@/lib/shop-utils";

import { useAllShops } from "./tanstack";

type Props = {
  initialData: ShopWithOwnerDetails[];
  initialHasNextPage: boolean;
  initialNextCursor: string | null;
  initialError?: string;
};

export const useInfiniteShops = ({
  initialData,
  initialHasNextPage,
  initialNextCursor,
  initialError,
}: Props) => {
  const {
    data,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useAllShops({
    initialData,
    initialNextCursor,
  });

  const allShops: ShopWithOwnerDetails[] = useMemo(() => {
    if (!data?.pages) {
      return initialData;
    }

    const serverData = data.pages[0]?.data ?? [];
    const clientPages = data.pages.slice(1);

    const clientShops = clientPages.flatMap((page) =>
      page.data.map(formatShopData)
    );

    return [...serverData.map(formatShopData), ...clientShops];
  }, [data, initialData]);

  const finalIsError =
    initialData.length === 0 ? isError : isError || !!initialError;
  const finalError =
    initialData.length === 0
      ? error
      : error || (initialError ? new Error(initialError) : null);

  return {
    allShops,
    isLoading: isLoading && initialData.length === 0,
    isError: finalIsError,
    error: finalError,
    hasNextPage: hasNextPage ?? initialHasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  };
};
