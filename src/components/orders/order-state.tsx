import { ShoppingCart } from "lucide-react";
import React from "react";

import { SharedCard } from "@/components/shared/shared-card";
import { Skeleton } from "@/components/ui/skeleton";

import { EmptyState } from "../ui/empty-state";

interface OrderWrapperProps {
  children: React.ReactNode;
}

export function OrderWrapper({ children }: OrderWrapperProps) {
  return (
    <SharedCard
      title="Order Management"
      headerClassName="flex flex-col items-start"
      description="View and manage your orders"
      className="gap-0 flex flex-col"
      contentClassName="flex-1 flex flex-col overflow-hidden"
    >
      {children}
    </SharedCard>
  );
}

export function OrderLoadingState() {
  return (
    <div className="space-y-4 p-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

export function OrderErrorState() {
  return (
    <div className="flex items-center justify-center h-full min-h-48">
      <p className="text-destructive">
        Failed to load order. Please try again.
      </p>
    </div>
  );
}

export function OrderEmptyState() {
  return (
    <EmptyState
      icon={<ShoppingCart className="h-10 w-10 text-muted-foreground" />}
      title="No orders found"
      description="You have no orders"
    />
  );
}
