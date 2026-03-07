"use client";

import {
  AlertCircle,
  Package,
  RefreshCw,
  TrendingUp,
  Truck,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useVendorDashboard } from "@/hooks/queries/useBatch";

import { ActiveBatchCard } from "./active-batch-card";
import { DirectOrdersSection } from "./direct-orders-section";

function DashboardStats({
  activeCount,
  totalEarnings,
}: {
  activeCount: number;
  totalEarnings: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      <Card className="bg-primary/5 border-primary/20 shadow-sm">
        <CardContent className="p-4 flex flex-col justify-center items-center text-center">
          <div className="bg-primary/10 p-2 rounded-full mb-2">
            <Truck className="h-5 w-5 text-primary" />
          </div>
          <span className="text-2xl font-bold text-foreground">
            {activeCount}
          </span>
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Active Deliveries
          </span>
        </CardContent>
      </Card>
      <Card className="bg-green-500/5 border-green-500/20 shadow-sm">
        <CardContent className="p-4 flex flex-col justify-center items-center text-center">
          <div className="bg-green-500/10 p-2 rounded-full mb-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <span className="text-2xl font-bold text-green-700">
            ₹{totalEarnings.toFixed(0)}
          </span>
          <span className="text-xs text-green-600/80 font-medium uppercase tracking-wide">
            Potential Earnings
          </span>
        </CardContent>
      </Card>
    </div>
  );
}

export function VendorDashboard() {
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useVendorDashboard();

  if (isLoading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading dashboard</AlertTitle>
        <AlertDescription>
          {error?.message || "Failed to load dashboard data."}
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) return null;

  const { open_batch, active_batches = [], direct_orders = [] } = data;
  const statusOrder: Record<string, number> = {
    IN_TRANSIT: 0,
    LOCKED: 1,
    OPEN: 2,
  };
  const allBatches = [
    ...(open_batch ? [open_batch] : []),
    ...active_batches,
  ].sort(
    (a, b) => (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99)
  );

  const totalVisibleEarnings =
    allBatches.reduce((acc, b) => acc + b.total_earnings, 0) +
    direct_orders.reduce((acc, o) => acc + o.total_earnings, 0);

  const totalActiveCount = allBatches.length + direct_orders.length;

  return (
    <div className="space-y-6 pb-20 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Manage your deliveries
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw
            className={`h-5 w-5 ${isRefetching ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      <DashboardStats
        activeCount={totalActiveCount}
        totalEarnings={totalVisibleEarnings}
      />

      {/* All batches through one component — handles OPEN, LOCKED, IN_TRANSIT */}
      {allBatches.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider">
              Batches
            </h3>
          </div>
          {allBatches.map((batch) => (
            <ActiveBatchCard key={batch.id} batch={batch} />
          ))}
        </section>
      )}

      {/* Direct orders */}
      {direct_orders.length > 0 && (
        <div className="mt-8">
          <DirectOrdersSection orders={direct_orders} />
        </div>
      )}

      {totalActiveCount === 0 && (
        <div className="text-center py-12 opacity-50">
          <Package className="h-12 w-12 mx-auto mb-3" />
          <p>No active orders right now.</p>
        </div>
      )}
    </div>
  );
}
