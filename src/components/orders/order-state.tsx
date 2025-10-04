import React from "react";

import { SharedCard } from "@/components/shared/shared-card";

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
    <div className="flex items-center justify-center h-full min-h-48">
      <p className="text-muted-foreground">Loading order...</p>
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
    <div className="flex items-center justify-center h-full min-h-48">
      <p className="text-muted-foreground">Your order is empty</p>
    </div>
  );
}
