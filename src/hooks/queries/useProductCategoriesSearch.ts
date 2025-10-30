"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { categoryAPIService } from "@/services/api";

export function useProductCategoriesSearch(query: string) {
  return useQuery({
    queryKey: queryKeys.shops.categories(query),
    queryFn: () => categoryAPIService.search(query),
    enabled: !!query && query.trim() !== "",
    staleTime: 5 * 60 * 1000,
  });
}
