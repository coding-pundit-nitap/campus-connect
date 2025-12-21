"use client";
import { Loader2 } from "lucide-react";
import React from "react";

import { useInfiniteScroll, useOrders } from "@/hooks";
import { SerializedOrderWithDetails } from "@/types";

import OrderCard from "./order-card";
import { OrderFilterBar } from "./order-filter-bar";
import {
  OrderEmptyState,
  OrderErrorState,
  OrderLoadingState,
} from "./order-state";

export default function OrderCardList() {
  const {
    allOrders,
    isLoading,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    filters,
    updateStatus,
    updateDateRange,
    clearFilters,
    hasActiveFilters,
  } = useOrders({
    initialData: [],
    initialError: undefined,
    initialHasNextPage: false,
    initialNextCursor: null,
  });

  const { lastElementRef } = useInfiniteScroll({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  });

  return (
    <div className="flex flex-col h-full">
      <OrderFilterBar
        filters={filters}
        onStatusChange={updateStatus}
        onDateRangeChange={updateDateRange}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {isLoading ? (
        <OrderLoadingState />
      ) : error ? (
        <OrderErrorState />
      ) : !allOrders || allOrders.length === 0 ? (
        <OrderEmptyState />
      ) : (
        <div className="flex-1 hide-scrollbar overflow-y-auto">
          <div className="space-y-4">
            {allOrders.map(
              (order: SerializedOrderWithDetails, index: number) => {
                const isLastElement = index === allOrders.length - 1;
                return (
                  <div
                    key={order.id}
                    ref={isLastElement ? lastElementRef : null}
                  >
                    <OrderCard order={order} />
                  </div>
                );
              }
            )}
          </div>

          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!hasNextPage && allOrders.length > 0 && !isFetchingNextPage && (
            <div className="py-4 text-center text-sm text-muted-foreground">
              You've reached the end of your orders.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
