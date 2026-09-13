import React from "react";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Mirrors UserProductCard's exact DOM shape (compact row on mobile,
 * vertical card on desktop) so the loading state doesn't jump when
 * real data arrives.
 */
export function UserProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-border bg-card flex flex-col h-full">
      <div className="flex md:hidden min-h-[144px] h-auto">
        <div className="relative w-28 shrink-0 bg-muted">
          <Skeleton className="h-full w-full rounded-none" />
        </div>
        <div className="flex flex-col justify-between flex-1 min-w-0 p-3 gap-2">
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-16 rounded-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-5 w-14" />
          </div>
          <Skeleton className="h-8 w-full rounded-lg" />
        </div>
      </div>

      <div className="hidden md:block">
        <Skeleton className="aspect-square w-full rounded-none" />
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20 rounded-full" />
            <Skeleton className="h-4 w-10 rounded-full" />
          </div>
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
