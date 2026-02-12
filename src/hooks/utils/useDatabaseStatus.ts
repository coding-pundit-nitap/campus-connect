"use client";

import { useMemo } from "react";

import { useDatabase } from "../queries/useDatabase";

export const useDatabaseStatus = ({ refetchInterval = 60000 } = {}) => {
  const {
    data: statusData,
    isError,
    refetch,
    isPending,
    dataUpdatedAt,
    isFetching,
  } = useDatabase({ refetchInterval });

  const data = useMemo(() => {
    return {
      isConnected: statusData?.status === "healthy",
      latency: statusData?.latency,
      error: statusData?.status !== "healthy" ? statusData?.details : undefined,
      lastChecked: dataUpdatedAt ? new Date(dataUpdatedAt) : undefined,
      isChecking: isFetching || isPending,
    };
  }, [statusData, isFetching, isPending, dataUpdatedAt]);

  return {
    ...data,
    isError,
    retry: refetch,
  };
};
