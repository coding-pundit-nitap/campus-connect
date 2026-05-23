"use client";

import { AlertCircle, Clock, MapPin, Package, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useVendorDashboard } from "@/hooks/queries/useBatch";
import { cn } from "@/lib/cn";

function DashboardStats({
  activeCount,
  totalEarnings,
}: {
  activeCount: number;
  totalEarnings: number;
}) {
  return (
    <div className="flex gap-8 sm:gap-12 px-1">
      <div className="flex flex-col">
        <span className="text-3xl font-extrabold tracking-tight">
          {activeCount}
        </span>
        <span className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">
          Active Deliveries
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-3xl font-extrabold tracking-tight text-green-600 dark:text-green-500">
          ₹{totalEarnings.toFixed(0)}
        </span>
        <span className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">
          Total Earnings
        </span>
      </div>
    </div>
  );
}

interface VendorDashboardProps {
  onFulfill?: (type: "batch" | "direct", id: string) => void;
}

export function VendorDashboard({ onFulfill }: VendorDashboardProps) {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useVendorDashboard();

  if (isLoading)
    return (
      <div className="space-y-6 pt-4">
        <Skeleton className="h-16 w-48 mb-6" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );

  if (isError) {
    return (
      <Alert variant="destructive" className="mt-4 rounded-2xl">
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
    <div className="space-y-8 pb-12 w-full select-none">
      {/* Header with Stats & Refresh */}
      <div className="flex items-start justify-between mb-4 border-b border-border/40 pb-4">
        <DashboardStats
          activeCount={totalActiveCount}
          totalEarnings={totalVisibleEarnings}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="text-muted-foreground hover:text-foreground transition-colors rounded-xl h-10 w-10 border"
          aria-label="Refresh dashboard"
        >
          <RefreshCw
            className={cn("h-4.5 w-4.5", isRefetching && "animate-spin")}
          />
        </Button>
      </div>

      {/* Batched Deliveries summaries */}
      {allBatches.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">
              Batch Orders
            </h3>
          </div>
          <div className="grid gap-4">
            {allBatches.map((batch) => {
              const isOpen = batch.status === "OPEN";
              const isPrep = batch.status === "LOCKED";
              const isInTransit = batch.status === "IN_TRANSIT";

              // Verify counts
              const ordersList = batch.orders || [];
              const completedCount = ordersList.filter(
                (o: any) => o.status === "COMPLETED"
              ).length;
              const progress =
                ordersList.length > 0
                  ? (completedCount / ordersList.length) * 100
                  : 0;

              return (
                <Card
                  key={batch.id}
                  className={cn(
                    "overflow-hidden border bg-card/45 hover:bg-card hover:shadow-md transition-all rounded-2xl flex flex-col justify-between p-5 border-l-4",
                    isOpen
                      ? "border-l-emerald-500"
                      : isPrep
                        ? "border-l-amber-500"
                        : "border-l-blue-500"
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                    {/* Manifest Title and Metrics */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-extrabold text-base leading-none tracking-tight">
                          Batch Delivery
                        </span>
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px] py-0 px-1.5 h-fit select-none"
                        >
                          #{batch.id.slice(-4).toUpperCase()}
                        </Badge>
                        <Badge
                          className={cn(
                            "text-white border-transparent text-[10px] py-0 px-2 h-fit font-bold select-none",
                            isOpen
                              ? "bg-emerald-500 hover:bg-emerald-500"
                              : isPrep
                                ? "bg-amber-500 hover:bg-amber-500"
                                : "bg-blue-500 hover:bg-blue-500"
                          )}
                        >
                          {isOpen ? "Open" : isPrep ? "Packing" : "On the way"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-x-4 gap-y-1 text-xs text-muted-foreground flex-wrap font-medium">
                        <span className="flex items-center gap-1">
                          <Package className="h-3.5 w-3.5" />
                          {batch.order_count} orders
                        </span>
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-500 font-bold">
                          ₹{batch.total_earnings.toFixed(0)}
                        </span>
                        {batch.cutoff_time && (
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="h-3.5 w-3.5" />
                            Cutoff:{" "}
                            {new Date(batch.cutoff_time).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Fulfill action trigger */}
                    <Button
                      onClick={() => {
                        if (onFulfill) {
                          onFulfill("batch", batch.id);
                        } else {
                          router.push(`/owner-shops?fulfill=batch:${batch.id}`);
                        }
                      }}
                      className={cn(
                        "rounded-xl h-11 px-5 font-bold shadow-sm active:scale-95 transition-all text-sm w-full sm:w-auto shrink-0",
                        isOpen
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : isPrep
                            ? "bg-amber-600 hover:bg-amber-700 text-white"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                      )}
                    >
                      {isOpen
                        ? "Start Packing"
                        : isPrep
                          ? "Continue Packing"
                          : "Start Delivering"}
                    </Button>
                  </div>

                  {/* Visual Progress bar for delivering batches */}
                  {isInTransit && ordersList.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between gap-4">
                      <Progress
                        value={progress}
                        className="h-1.5 flex-1 rounded-full bg-muted"
                      />
                      <span className="text-[10px] font-bold text-muted-foreground shrink-0 font-mono">
                        {completedCount}/{ordersList.length} delivered
                      </span>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Direct Deliveries summaries */}
      {direct_orders.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-border/40">
          <div className="flex items-center gap-2 px-1">
            <div className="h-2 w-2 rounded-full bg-orange-500" />
            <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">
              Direct Orders
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {direct_orders.map((order) => {
              const isOut = order.status === "OUT_FOR_DELIVERY";

              return (
                <Card
                  key={order.id}
                  className={cn(
                    "overflow-hidden border bg-card/45 hover:bg-card hover:shadow-md transition-all rounded-2xl flex flex-col justify-between p-5 border-l-4",
                    isOut ? "border-l-blue-500" : "border-l-orange-400"
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex flex-col min-w-0">
                        <span className="font-extrabold text-sm leading-tight tracking-tight text-foreground truncate">
                          Room {order.delivery_address?.room_number || "—"}
                        </span>
                        <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="h-3 w-3 shrink-0" />
                          Block {order.delivery_address?.hostel_block} •{" "}
                          {order.delivery_address?.building}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="block text-sm font-extrabold text-green-600 leading-none">
                          ₹{order.total_earnings.toFixed(0)}
                        </span>
                        <Badge
                          variant="outline"
                          className="font-mono text-[9px] py-0 px-1 mt-1 select-none"
                        >
                          #{order.display_id}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/20">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[9px] py-0.5 px-2 font-bold select-none rounded-md",
                          isOut
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                        )}
                      >
                        {isOut ? "On the way" : "Packing"}
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (onFulfill) {
                            onFulfill("direct", order.id);
                          } else {
                            router.push(
                              `/owner-shops?fulfill=direct:${order.id}`
                            );
                          }
                        }}
                        className={cn(
                          "rounded-lg font-bold text-xs h-8 px-4 shadow-sm active:scale-95 transition-all",
                          isOut
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "bg-orange-600 hover:bg-orange-700 text-white"
                        )}
                      >
                        Deliver
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Unified Empty State */}
      {totalActiveCount === 0 && (
        <div className="text-center py-20 px-4 border border-dashed rounded-2xl bg-muted/15 max-w-md mx-auto flex flex-col items-center">
          <Package className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <span className="font-bold text-muted-foreground">
            No active orders
          </span>
          <span className="text-xs text-muted-foreground/75 mt-1 text-center leading-relaxed">
            New orders will show up here automatically.
          </span>
        </div>
      )}
    </div>
  );
}
