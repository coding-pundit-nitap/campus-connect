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
import { getProductStates } from "@/lib/utils";
import { productAPIService } from "@/services/api/product-api.service";
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
    data,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: queryKeys.products.byShop(shop_id),
    queryFn: ({ pageParam }) =>
      productAPIService.fetchShopProducts({ shop_id, cursor: pageParam }),
    initialPageParam: initialNextCursor,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialData:
      initialProducts.length > 0
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

    const serverData = data.pages[0]?.data ?? [];
    const clientPages = data.pages.slice(1);
    const clientProducts = clientPages.flatMap((page) => page.data);

    return [...serverData, ...clientProducts];
  }, [data, initialProducts]);

  const {
    filters,
    filteredProducts,
    hasActiveFilters,
    updateFilter,
    clearFilters,
    updateSearch,
    updatePriceRange,
    updateStockFilter,
    updateSort,
    clearSearchFilter,
    clearPriceFilter,
    clearStockFilter,
  } = useProductFilters(allProducts);

  const displayProducts = hasActiveFilters ? filteredProducts : allProducts;

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
