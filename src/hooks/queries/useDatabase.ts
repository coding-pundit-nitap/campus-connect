"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { healthCheckAPIService } from "@/services/healthcheck";

export const useDatabase = ({ refetchInterval = 300000 } = {}) => {
  return useQuery({
    queryKey: queryKeys.health.database(),
    queryFn: () => healthCheckAPIService.checkDatabase(),
    refetchInterval: refetchInterval,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 60000,
    enabled: refetchInterval !== undefined,
  });
};
