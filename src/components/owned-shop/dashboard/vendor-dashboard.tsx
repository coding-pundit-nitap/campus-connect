"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useVendorDashboard } from "@/hooks/queries/useBatch";

import { ActiveBatchCard } from "./active-batch-card";
import { BatchHostelBlockView } from "./batch-hostel-block-view";
import { OpenBatchCard } from "./open-batch-card";

export function VendorDashboard() {
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useVendorDashboard();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

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

  if (!data) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No data</AlertTitle>
        <AlertDescription>No dashboard data available.</AlertDescription>
      </Alert>
    );
  }

  const { open_batch, active_batches } = data;
  const hasNoBatches = !open_batch && active_batches.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Batch Dashboard</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {hasNoBatches && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No active batches</AlertTitle>
          <AlertDescription>
            Orders will start appearing here once customers place them.
          </AlertDescription>
        </Alert>
      )}

      {open_batch && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">
            Currently Open
          </h3>
          <OpenBatchCard batch={open_batch} />
          <div className="mt-4">
            <BatchHostelBlockView
              title="Group open orders by hostel"
              orders={open_batch.orders}
            />
          </div>
        </section>
      )}

      {active_batches.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">
            Ready for Action
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {active_batches.map((batch) => (
              <div key={batch.id} className="space-y-3">
                <ActiveBatchCard batch={batch} />
                <BatchHostelBlockView
                  title="Group batch orders by hostel"
                  orders={batch.orders}
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
