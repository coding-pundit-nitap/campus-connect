"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import axiosInstance from "@/lib/axios";
import { queryKeys } from "@/lib/query-keys";
import { ActionResponse } from "@/types";

export interface BatchProgressState {
  batchId: string | null;
  status: string | null;
  collectiveTotal: number;
  minRequired: number | null;
  isMet: boolean;
  cutoffTime: string | null;
}

interface BatchProgressEvent {
  batchId: string;
  shopId: string;
  status: string;
  collectiveTotal: number;
  minRequired: number | null;
}

async function fetchBatchProgress(shopId: string): Promise<BatchProgressState> {
  const response = await axiosInstance.get<ActionResponse<BatchProgressState>>(
    `/shops/${shopId}/batch-progress`
  );
  return response.data.data;
}

export function useBatchProgress(shopId: string | undefined) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.batch.progress(shopId ?? ""),
    queryFn: () => fetchBatchProgress(shopId as string),
    enabled: !!shopId,
    staleTime: 10_000,
  });

  useEffect(() => {
    if (!shopId) return;

    const eventSource = new EventSource(
      `/api/shops/${shopId}/batch-progress/stream`
    );

    const handleProgress = (event: MessageEvent) => {
      try {
        const payload: BatchProgressEvent = JSON.parse(event.data);
        queryClient.setQueryData<BatchProgressState>(
          queryKeys.batch.progress(shopId),
          (old) => ({
            batchId: payload.batchId,
            status: payload.status,
            collectiveTotal: payload.collectiveTotal,
            minRequired: payload.minRequired,
            isMet:
              payload.minRequired === null ||
              payload.collectiveTotal >= payload.minRequired,
            cutoffTime: old?.cutoffTime ?? null,
          })
        );
      } catch {
        // Ignore malformed events.
      }
    };

    eventSource.addEventListener("batch_progress", handleProgress);
    eventSource.onerror = () => {
      // The browser auto-reconnects EventSource; on reconnect the batch may
      // have rolled over, so invalidate to force a fresh REST read rather
      // than trusting stale in-memory state.
      queryClient.invalidateQueries({
        queryKey: queryKeys.batch.progress(shopId),
      });
    };

    return () => {
      eventSource.removeEventListener("batch_progress", handleProgress);
      eventSource.close();
    };
  }, [shopId, queryClient]);

  return { data: query.data, isLoading: query.isLoading };
}
