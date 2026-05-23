"use client";

import { Loader2, Package } from "lucide-react";
import React from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { useOrderConsoleData } from "@/hooks/queries/useBatch";
import { SerializedOrderWithDetails } from "@/types";

import { DirectOrderCard } from "../order-card/direct-order-card";

export function DirectDeliveryView() {
  const { data, isLoading } = useOrderConsoleData();
  const orders = data?.directOrders || [];

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        title="No Direct Deliveries"
        description="You have no pending direct delivery orders."
        icon={<Package className="h-12 w-12 text-muted-foreground/50" />}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {orders.map((order: SerializedOrderWithDetails) => (
        <DirectOrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
