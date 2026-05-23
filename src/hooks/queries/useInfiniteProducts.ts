"use client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useProductActions } from "@/hooks/common/useProductActions";
import { queryKeys } from "@/lib/query-keys";
import { productAPIService } from "@/services/product";
import { SerializedProduct } from "@/types/product.types";

type Props = {
  initialProducts: SerializedProduct[];
  initialHasNextPage: boolean;
  initialNextCursor: string | null;
  initialError?: string;
  limit?: number;
  categoryId?: string;
  hasDiscount?: boolean;
};

export const useInfiniteProducts = ({
  initialProducts,
  initialHasNextPage,
  initialNextCursor,
  initialError,
  limit,
  categoryId,
  hasDiscount,
}: Props) => {
  const isFiltered = !!categoryId || !!hasDiscount;

  const initialDataValue = useMemo(
    () =>
      !isFiltered && initialProducts.length > 0
        ? {
            pages: [
              {
                initialProducts: initialProducts,
                nextCursor: initialNextCursor,
                hasNextPage: initialHasNextPage,
                error: initialError,
              },
            ],
            pageParams: [null as string | null],
          }
        : undefined,
    [
      isFiltered,
      initialProducts,
      initialNextCursor,
      initialHasNextPage,
      initialError,
    ]
  );

  const {
    data,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: queryKeys.products.list({ limit, categoryId, hasDiscount }),
    queryFn: ({ pageParam }) =>
      productAPIService.fetchProducts({
        cursor: pageParam,
        limit,
        categoryId,
        hasDiscount,
      }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialData: initialDataValue,
    refetchOnMount: true,
  });

  const allProducts: SerializedProduct[] = useMemo(() => {
    if (!data?.pages) {
      return isFiltered ? [] : initialProducts;
    }

    return data.pages.flatMap((page) => page.initialProducts ?? []);
  }, [data, initialProducts, isFiltered]);

  const { onAddToCart, onViewDetails, isAddingToCart } = useProductActions({
    mode: "user",
  });

  return {
    isLoading: isFiltered
      ? isLoading
      : isLoading && initialProducts.length === 0,
    isError: isFiltered ? isError : isError || !!initialError,
    error: isFiltered
      ? error
      : error || (initialError ? new Error(initialError) : null),
    hasNextPage: hasNextPage ?? (isFiltered ? false : initialHasNextPage),
    isFetchingNextPage,
    fetchNextPage,
    allProducts,
    onAddToCart,
    onViewDetails,
    isAddingToCart,
  };
};
