"use client";
import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { searchAPIService } from "@/services/api";

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
