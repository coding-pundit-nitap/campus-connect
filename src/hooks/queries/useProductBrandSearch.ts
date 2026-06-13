"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { brandAPIService } from "@/services/brand";

export function useProductBrandSearch(query: string) {
  return useQuery({
    queryKey: queryKeys.shops.brands(query),
    queryFn: () => brandAPIService.search(query),
    enabled: !!query && query.trim() !== "",
    staleTime: 5 * 60 * 1000,
  });
}

export function useActiveBrands() {
  return useQuery({
    queryKey: queryKeys.shops.brands(""),
    queryFn: () => brandAPIService.search(""),
    staleTime: 5 * 60 * 1000,
  });
}
