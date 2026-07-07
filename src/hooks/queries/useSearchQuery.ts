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
import { ActionResponse } from "@/types";
import { OrderStatus } from "@/types/prisma.types";

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
  q: string;
  type: ShopType | "ALL";
  veg: boolean;
  brand_id: string | null;
};

export const useProductSearch = (filters: ProductSearchFilters) => {
  return useQuery({
    queryKey: queryKeys.search.productSearch({
      q: filters.q,
      type: filters.type,
      veg: filters.veg,
      brand_id: filters.brand_id,
    }),
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams();
      if (filters.q.trim()) params.set("q", filters.q.trim());
      if (filters.type !== "ALL") params.set("type", filters.type);
      if (filters.type === "CANTEEN" && filters.veg) params.set("veg", "true");
      if (filters.type === "STATIONERY" && filters.brand_id)
        params.set("brand_id", filters.brand_id);
      params.set("limit", "24");

      const response = await axiosInstance.get<
        ActionResponse<DBSearchResult<ProductDocument>>
      >(`search/products?${params.toString()}`, { signal });
      return (
        response.data?.data ?? { hits: [], total: 0, page: 1, total_pages: 0 }
      );
    },
    staleTime: 1000 * 30,
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
