"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { vendorApiService } from "@/services";
export function useVendorOverview() {
  return useQuery({
    queryKey: queryKeys.seller.overview(),
    queryFn: vendorApiService.getVendorOverview,
  });
}
