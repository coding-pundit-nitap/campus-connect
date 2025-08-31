"use client";
import React from "react";

import { useUserOrders } from "@/hooks";

import OrderCard from "./order-card";

export default function OrderCardList() {
  const orders = useUserOrders();

  if (orders.isLoading) {
    return <div>Loading orders...</div>;
  }

  if (orders.error) {
    return <div>Error loading orders: {orders.error.message}</div>;
  }

  if (!orders.data || orders.data.length === 0) {
    return <div>No orders found.</div>;
  }

  return (
    <div className="space-y-4">
      {orders.data.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
