"use client";
import React from "react";

import { useUserOrders } from "@/hooks";

import OrderCard from "./order-card";
import {
  OrderEmptyState,
  OrderErrorState,
  OrderLoadingState,
} from "./order-state";

export default function OrderCardList() {
  const orders = useUserOrders();

  if (orders.isLoading) {
    return <OrderLoadingState />;
  }

  if (orders.error) {
    return <OrderErrorState />;
  }

  if (!orders.data || orders.data.length === 0) {
    return <OrderEmptyState />;
  }

  return (
    <div className="flex-1 hide-scrollbar overflow-y-auto">
      <div className="space-y-4">
        {orders.data.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}
