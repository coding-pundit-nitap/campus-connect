"use client";

import { useQuery } from "@tanstack/react-query";

import { BatchProgress } from "@/components/cart-drawer/batch-progress";
import type { BatchProgressState } from "@/hooks/utils/useBatchProgress";
import axiosInstance from "@/lib/axios";
import { queryKeys } from "@/lib/query-keys";
import { ActionResponse } from "@/types";

interface BatchProgressBannerProps {
  shopId: string;
}

async function fetchBatchProgress(
  shopId: string
): Promise<BatchProgressState> {
  const response = await axiosInstance.get<ActionResponse<BatchProgressState>>(
    `/shops/${shopId}/batch-progress`
  );
  return response.data.data;
}

/**
 * Reads the same React Query cache entry that `useBatchProgress` (used by
 * the nested `BatchProgress`) populates, using the identical query key,
 * queryFn, and staleTime. This is a deliberate near-duplicate of
 * `useBatchProgress`'s internal `useQuery` call rather than a call to the
 * hook itself: `useBatchProgress` also opens a persistent `EventSource` in
 * a `useEffect`, and calling it here (purely to read `minRequired` for the
 * empty-state guard below) would open a second SSE connection alongside
 * the one `BatchProgress` opens, for every page where this banner is
 * visible.
 *
 * A fully passive read (e.g. `queryFn: skipToken`) was considered instead,
 * but was found to deadlock: nothing would ever populate this cache entry
 * until `BatchProgress` mounts, and `BatchProgress` only mounts once this
 * guard has already passed. Keeping a real `queryFn` here — but no
 * `useEffect`/`EventSource` — performs the initial REST fetch needed to
 * decide whether to render at all, while the live SSE subscription still
 * comes from exactly one place: the nested `BatchProgress`'s own
 * `useBatchProgress` call, once it mounts.
 */
function useBatchProgressCache(shopId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.batch.progress(shopId ?? ""),
    queryFn: () => fetchBatchProgress(shopId as string),
    enabled: !!shopId,
    staleTime: 10_000,
  });
}

export function BatchProgressBanner({ shopId }: BatchProgressBannerProps) {
  const { data, isLoading } = useBatchProgressCache(shopId);

  if (isLoading || !data || data.minRequired === null) {
    return null;
  }

  return (
    <div className="rounded-xl border-2 border-border bg-muted/10 px-4 py-3 shadow-sm">
      <BatchProgress shopId={shopId} />
    </div>
  );
}
