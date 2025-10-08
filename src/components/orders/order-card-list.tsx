"use client";
import React from "react";

import useOrders from "@/hooks/tanstack/useOrders";
import { SerializedOrderWithDetails } from "@/types";

import OrderCard from "./order-card";
import {
  OrderEmptyState,
  OrderErrorState,
  OrderLoadingState,
} from "./order-state";

export default function OrderCardList() {
  const hookResult = useOrders({
    initialData: [],
    initialError: undefined,
    initialHasNextPage: false,
    initialNextCursor: null,
  });

  if (!hookResult) {
    return <OrderLoadingState />;
  }

  const { allOrders, isLoading, error } = hookResult;

  if (isLoading) {
    return <OrderLoadingState />;
  }

  if (error) {
    return <OrderErrorState />;
  }

  if (!allOrders || allOrders.length === 0) {
    return <OrderEmptyState />;
  }

  return (
    <div className="flex-1 hide-scrollbar overflow-y-auto">
      <div className="space-y-4">
        {allOrders.map((order: SerializedOrderWithDetails) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}
