"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { productAPIService } from "@/services/product";
import { SerializedProduct } from "@/types/product.types";

export function useProductDeals(limit = 10) {
  return useQuery({
    queryKey: queryKeys.products.list({ limit, hasDiscount: true }),
    queryFn: async (): Promise<SerializedProduct[]> => {
      const response = await productAPIService.fetchProducts({
        limit,
        hasDiscount: true,
      });
      return response.initialProducts || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}
