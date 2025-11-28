"use client";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { DateRange } from "react-day-picker";

import { queryKeys } from "@/lib/query-keys";
import { searchAPIService } from "@/services/search";
import { OrderStatus } from "@/types/prisma.types";

export const useSearchQuery = (query: string) => {
  return useQuery({
    queryKey: queryKeys.search.query(query),
    queryFn: () => searchAPIService.search(query),
    enabled: !!query && query.trim().length > 0,
    staleTime: 1000 * 60 * 5,
  });
};

export const useProductSearchQuery = (query: string) => {
  return useQuery({
    queryKey: queryKeys.search.products(query),
    queryFn: () => searchAPIService.searchProducts(query),
    enabled: !!query && query.trim().length > 0,
    staleTime: 1000 * 60 * 5,
  });
};

export const useOrderSearchQuery = (
  query: string,
  filters: { status?: OrderStatus; dateRange?: DateRange }
) => {
  return useInfiniteQuery({
    queryKey: queryKeys.search.orders(query, filters),
    queryFn: ({ pageParam }) =>
      searchAPIService.searchOrders({
        query,
        status: filters.status,
        dateRange: filters.dateRange,
        pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
};
