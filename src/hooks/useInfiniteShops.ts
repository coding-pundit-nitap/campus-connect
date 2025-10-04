"use client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { queryKeys } from "@/lib/query-keys";
import { enhanceShopData, ShopWithOwnerDetails } from "@/lib/shop-utils";
import { shopAPIService } from "@/services/api/shop-api.service";

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
  } = useInfiniteQuery({
    queryKey: queryKeys.shops.all,
    queryFn: ({ pageParam }) =>
      shopAPIService.fetchShops({ cursor: pageParam }),
    initialPageParam: initialNextCursor,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialData:
      initialData.length > 0
        ? {
            pages: [
              {
                data: initialData,
                nextCursor: initialNextCursor,
              },
            ],
            pageParams: [null],
          }
        : undefined,
  });

  const allShops: ShopWithOwnerDetails[] = useMemo(() => {
    if (!data?.pages) return initialData;

    const serverData = data.pages[0]?.data ?? [];
    const clientPages = data.pages.slice(1);

    const clientShops = clientPages.flatMap((page) =>
      page.data.map(enhanceShopData)
    );

    return [...serverData.map(enhanceShopData), ...clientShops];
  }, [data, initialData]);

  return {
    allShops,
    isLoading: isLoading && initialData.length === 0,
    isError: isError || !!initialError,
    error: error || (initialError ? new Error(initialError) : null),
    hasNextPage: hasNextPage ?? initialHasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  };
};
