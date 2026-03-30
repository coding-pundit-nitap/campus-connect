"use client";

import { AlertCircle, Package, RefreshCw } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useVendorDashboard } from "@/hooks/queries/useBatch";
import { cn } from "@/lib/cn";

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
    <div className="flex gap-12 px-1">
      <div className="flex flex-col">
        <span className="text-3xl font-bold tracking-tight">{activeCount}</span>
        <span className="text-sm font-medium text-muted-foreground mt-1">
          Active
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-3xl font-bold tracking-tight text-green-600">
          ₹{totalEarnings.toFixed(0)}
        </span>
        <span className="text-sm font-medium text-muted-foreground mt-1">
          Manifest Value
        </span>
      </div>
    </div>
  );
}

export function VendorDashboard() {
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useVendorDashboard();

  if (isLoading)
    return (
      <div className="space-y-6 pt-4">
        <Skeleton className="h-20 w-48 mb-6" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );

  if (isError) {
    return (
      <Alert variant="destructive" className="mt-4">
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
    <div className="space-y-10 pb-12 w-full">
      {/* 1. Header with Stats & Refresh */}
      <div className="flex items-start justify-between mb-2">
        <DashboardStats
          activeCount={totalActiveCount}
          totalEarnings={totalVisibleEarnings}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Refresh dashboard"
        >
          <RefreshCw
            className={cn("h-5 w-5", isRefetching && "animate-spin")}
          />
        </Button>
      </div>

      {/* 2. Active Batches Manifest Section */}
      {allBatches.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-widest">
              Batched Delivery
            </h3>
          </div>
          <div className="grid gap-4">
            {allBatches.map((batch) => (
              <ActiveBatchCard key={batch.id} batch={batch} />
            ))}
          </div>
        </section>
      )}

      {/* 3. Direct Delivery Section (Positioned below batches) */}
      {direct_orders.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-border/40">
          <div className="flex items-center gap-2 px-1">
            <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-widest">
              Direct Delivery
            </h3>
          </div>
          <DirectOrdersSection orders={direct_orders} />
        </section>
      )}

      {/* 4. Unified Empty State */}
      {totalActiveCount === 0 && (
        <div className="text-center py-20 px-4 border rounded-2xl bg-muted/20 border-dashed border-border/60">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground font-semibold text-lg">
            Your manifest is clear
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            New customer orders will appear here automatically.
          </p>
        </div>
      )}
    </div>
  );
}
