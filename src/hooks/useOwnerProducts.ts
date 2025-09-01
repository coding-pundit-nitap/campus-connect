import { Product } from "@prisma/client";
import { useMemo } from "react";

import { useShopProducts } from "./tanstack";
import { useProductFilters } from "./useProductFilters";

export const useOwnerProducts = (shop_id: string) => {
  const {
    data,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useShopProducts(shop_id);

  const allProducts: Product[] = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data]);

  // const allProducts = [
  //   {
  //     created_at: new Date(),
  //     id: "123",
  //     image_url: "/placeholders/placeholder.png",
  //     name: "testing",
  //     price: 20,
  //     rating: 5,
  //     shop_id: "123",
  //     stock_quantity: 5,
  //     updated_at: new Date(),
  //     description: null,
  //     discount: null,
  //     category_id: null,
  //   },
  // ];

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

  const isEmpty = allProducts.length === 0;
  const displayProducts = hasActiveFilters ? filteredProducts : allProducts;

  return {
    // Product data
    allProducts,
    displayProducts,
    isEmpty,

    // Loading states
    isLoading,
    isError,
    error,

    // Pagination
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,

    // Filtering
    filters,
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
  };
};
