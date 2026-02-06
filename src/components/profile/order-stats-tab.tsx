"use client";

import { ChevronRight, Package, ShoppingBag, TrendingUp } from "lucide-react";
import Link from "next/link";

import { SharedCard } from "@/components/shared/shared-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrderStats } from "@/hooks";
import { SerializedOrderWithDetails } from "@/types";

export function OrderStatsTab() {
  const { data: recentOrders = [], isLoading } = useOrderStats();
  const totalCount = recentOrders.length;

  if (isLoading) {
    return (
      <SharedCard title="Order Summary">
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </SharedCard>
    );
  }

  const statusCounts = recentOrders.reduce(
    (acc: Record<string, number>, order: SerializedOrderWithDetails) => {
      acc[order.order_status] = (acc[order.order_status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <SharedCard
      title="Order Summary"
      description="Quick overview of your orders"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg border bg-muted/30 text-center">
            <ShoppingBag className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{totalCount}</p>
            <p className="text-xs text-muted-foreground">Total Orders</p>
          </div>
          <div className="p-4 rounded-lg border bg-muted/30 text-center">
            <Package className="h-6 w-6 mx-auto mb-2 text-orange-500" />
            <p className="text-2xl font-bold">
              {(statusCounts["PREPARING"] || 0) + (statusCounts["NEW"] || 0)}
            </p>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </div>
          <div className="p-4 rounded-lg border bg-muted/30 text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">
              {statusCounts["COMPLETED"] || 0}
            </p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="p-4 rounded-lg border bg-muted/30 text-center">
            <Package className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">
              {statusCounts["READY_FOR_PICKUP"] || 0}
            </p>
            <p className="text-xs text-muted-foreground">Ready for Pickup</p>
          </div>
        </div>

        {recentOrders.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground">
              Recent Orders
            </h4>
            {recentOrders
              .slice(0, 3)
              .map((order: SerializedOrderWithDetails) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">Order #{order.display_id}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.items.length} item
                      {order.items.length > 1 ? "s" : ""} • ₹{order.total_price}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-muted">
                      {order.order_status.replace(/_/g, " ")}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
          </div>
        )}

        <Button asChild className="w-full">
          <Link href="/orders">
            View All Orders
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>
    </SharedCard>
  );
}
