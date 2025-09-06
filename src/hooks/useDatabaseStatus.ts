"use client";

import { useMemo } from "react";

import { useDatabase } from "./tanstack/useDatabase";

export const useDatabaseStatus = ({ refetchInterval = 60000 } = {}) => {
  const {
    data: statusData,
    isLoading,
    isError,
    isFetching,
    refetch,
    dataUpdatedAt,
  } = useDatabase({ refetchInterval });

  const data = useMemo(() => {
    return {
      isConnected: statusData?.status === "healthy",
      latency: statusData?.latency,
      error: statusData?.status !== "healthy" ? statusData?.details : undefined,
      lastChecked: dataUpdatedAt ? new Date(dataUpdatedAt) : undefined,
      isChecking: isFetching,
    };
  }, [statusData, isFetching, dataUpdatedAt]);

  return {
    ...data,
    isLoading,
    isError,
    retry: refetch,
  };
};
