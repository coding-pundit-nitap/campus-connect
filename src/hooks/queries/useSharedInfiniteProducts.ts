"use client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import {
  useAddToCart,
  useImageDelete,
  useShopProductsDelete,
} from "@/hooks/queries";
import { useProductFilters } from "@/hooks/ui/useProductFilters";
import { queryKeys } from "@/lib/query-keys";
import { getProductStates, productUIServices } from "@/lib/utils";
import { productAPIService } from "@/services/product";
import { ProductDataDetails, SerializedProduct } from "@/types/product.types";

type Props = {
  shop_id: string;
  mode: "owner" | "user";
  initialProducts: SerializedProduct[];
  initialProductStates: ProductDataDetails;
  initialHasNextPage: boolean;
  initialNextCursor: string | null;
  initialError?: string;
};

export const useSharedInfiniteProducts = ({
  shop_id,
  mode,
  initialProducts,
  initialHasNextPage,
  initialNextCursor,
  initialError,
}: Props) => {
  const router = useRouter();
  const {
    filters,
    updateFilter,
    clearFilters,
    updateSearch,
    updatePriceRange,
    updateStockFilter,
    updateSort,
    clearSearchFilter,
    clearPriceFilter,
    clearStockFilter,
  } = useProductFilters();

  const hasActiveFilters = useMemo(() => {
    return productUIServices.hasActiveFilters(filters);
  }, [filters]);

  const {
    data,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: [
      ...queryKeys.products.byShop(shop_id),
      filters.sortBy,
      filters.sortOrder,
      filters.categoryId,
      filters.search,
      filters.inStock,
    ],
    queryFn: ({ pageParam }) =>
      productAPIService.fetchShopProducts({
        shop_id,
        cursor: pageParam,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        categoryId: filters.categoryId ?? undefined,
        search: filters.search,
        inStock: filters.inStock ?? undefined,
      }),
    initialPageParam: initialNextCursor,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialData:
      initialProducts.length > 0 &&
      !hasActiveFilters &&
      filters.sortBy === "created_at" &&
      filters.sortOrder === "desc" &&
      !filters.categoryId &&
      !filters.search
        ? {
            pages: [
              {
                data: initialProducts,
                nextCursor: initialNextCursor,
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

    return data.pages.flatMap((page) => page.data);
  }, [data, initialProducts]);

  const displayProducts = allProducts;

  const productStates = useMemo(
    () =>
      getProductStates(
        allProducts,
        displayProducts,
        hasActiveFilters,
        isLoading
      ),
    [allProducts, displayProducts, hasActiveFilters, isLoading]
  );

  const { mutate: deleteProduct } = useShopProductsDelete();
  const { mutateAsync: deleteImage } = useImageDelete();
  const { mutate: addToCart, isPending: isAddingToCart } = useAddToCart();

  const actionHandlers = useMemo(() => {
    if (mode === "owner") {
      return {
        onDeleteProduct: async (product_id: string, image_key: string) => {
          await deleteImage(image_key);
          deleteProduct({ product_id, shop_id });
        },
        onResetFilters: clearFilters,
      };
    }

    return {
      onAddToCart: (product_id: string, quantity: number) => {
        addToCart({ product_id, quantity });
      },
      onViewDetails: (product_id: string) => {
        router.push(`/product/${product_id}`);
      },
      onResetFilters: clearFilters,
    };
  }, [
    mode,
    deleteProduct,
    deleteImage,
    clearFilters,
    addToCart,
    router,
    shop_id,
  ]);

  const loadingStates = useMemo(
    () => ({
      isInitialLoading: isLoading && initialProducts.length === 0,
      hasError: isError || !!initialError,
      isEmptyState: !isLoading && allProducts.length === 0,
    }),
    [
      isLoading,
      initialProducts.length,
      isError,
      initialError,
      allProducts.length,
    ]
  );

  return {
    ...productStates,
    ...loadingStates,
    isLoading: isLoading && initialProducts.length === 0,
    isError: isError || !!initialError,
    error: error || (initialError ? new Error(initialError) : null),
    hasNextPage: hasNextPage ?? initialHasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    filters,
    hasActiveFilters,
    updateFilter,
    updateSearch,
    updatePriceRange,
    updateStockFilter,
    updateSort,
    clearSearchFilter,
    clearPriceFilter,
    clearStockFilter,
    ...actionHandlers,
    ...(mode === "user" && { isAddingToCart }),
  };
};
