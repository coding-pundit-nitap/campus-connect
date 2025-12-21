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
};

export const useInfiniteProducts = ({
  initialProducts,
  initialHasNextPage,
  initialNextCursor,
  initialError,
  limit,
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
    queryKey: queryKeys.products.all,
    queryFn: ({ pageParam }) =>
      productAPIService.fetchProducts({ cursor: pageParam, limit }),
    initialPageParam: initialNextCursor,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialData:
      initialProducts.length > 0
        ? {
            pages: [
              {
                initialProducts: initialProducts,
                nextCursor: initialNextCursor,
                hasNextPage: initialHasNextPage,
                error: initialError,
              },
            ],
            pageParams: [null],
          }
        : undefined,
  });

  const allProducts: SerializedProduct[] = useMemo(() => {
    if (!data?.pages) {
      return initialProducts;
    }

    const serverData = data.pages[0]?.initialProducts ?? [];
    const clientPages = data.pages.slice(1);
    const clientProducts = clientPages.flatMap((page) => page.initialProducts);

    return [...serverData, ...clientProducts];
  }, [data, initialProducts]);

  const { onAddToCart, onViewDetails, isAddingToCart } = useProductActions({
    mode: "user",
  });

  return {
    isLoading: isLoading && initialProducts.length === 0,
    isError: isError || !!initialError,
    error: error || (initialError ? new Error(initialError) : null),
    hasNextPage: hasNextPage ?? initialHasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    allProducts,
    onAddToCart,
    onViewDetails,
    isAddingToCart,
  };
};
