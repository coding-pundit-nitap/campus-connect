"use client";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { DateRange } from "react-day-picker";

import { ShopType } from "@/generated/client";
import axiosInstance from "@/lib/axios";
import { queryKeys } from "@/lib/query-keys";
import { searchAPIService } from "@/services/search";
import {
  DBSearchResult,
  ProductDocument,
} from "@/services/search/db-search.service";
import { OrderStatus } from "@/types/prisma.types";
import { ActionResponse } from "@/types/response.types";

export const useSearchQuery = (query: string) => {
  return useQuery({
    queryKey: queryKeys.search.query(query),
    queryFn: ({ signal }) => searchAPIService.search(query, signal),
    enabled: !!query && query.trim().length >= 2,
    staleTime: 1000 * 60 * 5,
  });
};

export const useProductSearchQuery = (query: string) => {
  return useQuery({
    queryKey: queryKeys.search.products(query),
    queryFn: ({ signal }) => searchAPIService.searchProducts(query, signal),
    enabled: !!query && query.trim().length >= 2,
    staleTime: 1000 * 60 * 5,
  });
};

export type ProductSearchFilters = {
  query: string;
  shopType: ShopType | "ALL";
  isVeg: boolean;
  brand: string | null;
};

/**
 * Full-filter product search hook for the search page.
 * Always enabled (even with empty query) so initial catalogue loads.
 * TanStack Query caches each unique filter combo independently.
 */
export const useProductSearch = (filters: ProductSearchFilters) => {
  return useQuery({
    queryKey: queryKeys.search.productSearch({
      query: filters.query,
      shopType: filters.shopType,
      isVeg: filters.isVeg,
      brand: filters.brand,
    }),
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams();
      if (filters.query.trim()) params.set("q", filters.query.trim());
      if (filters.shopType !== "ALL") params.set("type", filters.shopType);
      if (filters.shopType === "CANTEEN" && filters.isVeg)
        params.set("veg", "true");
      if (filters.shopType === "STATIONERY" && filters.brand)
        params.set("brand", filters.brand);
      params.set("limit", "24");

      const response = await axiosInstance.get<
        ActionResponse<DBSearchResult<ProductDocument>>
      >(`search/products?${params.toString()}`, { signal });
      return response.data.data;
    },
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
  });
};

export const useOrderSearchQuery = (
  query: string,
  filters: { status?: OrderStatus; dateRange?: DateRange; hostelBlock?: string }
) => {
  return useInfiniteQuery({
    queryKey: queryKeys.search.orders(query, filters),
    queryFn: ({ pageParam, signal }) =>
      searchAPIService.searchOrders({
        query,
        status: filters.status,
        dateRange: filters.dateRange,
        hostelBlock: filters.hostelBlock,
        pageParam,
        signal,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
};
