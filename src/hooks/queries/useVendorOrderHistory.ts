"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { vendorApiService } from "@/services";
import type { OrderHistoryParams } from "@/services/vendor/vendor-api.service";

export function useVendorOrderHistory(params: OrderHistoryParams) {
  return useQuery({
    queryKey: queryKeys.seller.orderHistory(params),
    queryFn: () => vendorApiService.getVendorOrderHistory(params),
    staleTime: 30_000,
  });
}
