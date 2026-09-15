"use client";

import { BatchProgress } from "@/components/cart-drawer/batch-progress";
import { useBatchProgress } from "@/hooks/utils/useBatchProgress";

interface BatchProgressBannerProps {
  shopId: string;
}

export function BatchProgressBanner({ shopId }: BatchProgressBannerProps) {
  const { data, isLoading } = useBatchProgress(shopId);

  if (isLoading || !data || data.minRequired === null) {
    return null;
  }

  return (
    <div className="rounded-xl border-2 border-border bg-muted/10 px-4 py-3 shadow-sm">
      <BatchProgress shopId={shopId} />
    </div>
  );
}
