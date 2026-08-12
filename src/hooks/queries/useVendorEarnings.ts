"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { EarningsPeriod } from "@/lib/utils/earnings";
import { vendorApiService } from "@/services";

export function useVendorEarnings(period: EarningsPeriod) {
  return useQuery({
    queryKey: queryKeys.seller.earnings(period),
    queryFn: () => vendorApiService.getVendorEarnings(period),
    staleTime: 30_000,
  });
}
