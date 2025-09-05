"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import healthCheckAPIService from "@/services/api/healthcheck-api.service";

export const useDatabase = ({ refetchInterval = 60000 } = {}) => {
  return useQuery({
    queryKey: queryKeys.health.database(),
    queryFn: () => healthCheckAPIService.checkDatabase(),
    refetchInterval: refetchInterval,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  });
};
