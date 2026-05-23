"use client";

import { addHours, format, subHours } from "date-fns";
import { Clock,Loader2 } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  useCloseBatch,
  useOrderConsoleData,
  useUpdateBatchCutoffTime,
} from "@/hooks/queries/useBatch";
import { SerializedOrderWithDetails } from "@/types";

import { BatchOrderCard } from "../order-card/batch-order-card";

interface AddressSnapshot {
  hostel_block?: string | null;
  building?: string;
  room_number?: string;
}

export function BatchDeliveryView() {
  const { data, isLoading } = useOrderConsoleData();
  const updateTimeMutation = useUpdateBatchCutoffTime();
  const closeBatchMutation = useCloseBatch();

  const isPending =
    updateTimeMutation.isPending || closeBatchMutation.isPending;

  const handleAdjustTime = (hours: number) => {
    if (!data?.activeBatch) return;
    const newDate =
      hours > 0
        ? addHours(new Date(data.activeBatch.cutoff_time), hours)
        : subHours(new Date(data.activeBatch.cutoff_time), Math.abs(hours));

    updateTimeMutation.mutate({
      batchId: data.activeBatch.id,
      newCutoffTime: newDate,
    });
  };

  const handleCloseBatch = () => {
    if (!data?.activeBatch) return;
    closeBatchMutation.mutate(data.activeBatch.id);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data?.activeBatch) {
    return (
      <EmptyState
        title="No Active Batch"
        description="There are currently no open batches. Orders placed will wait for the next scheduled batch."
        icon={<Clock className="h-12 w-12 text-muted-foreground/50" />}
      />
    );
  }

  const groups: Record<string, SerializedOrderWithDetails[]> = {};
  data.batchOrders.forEach((order: SerializedOrderWithDetails) => {
    const snapshot: AddressSnapshot | null = order.delivery_address_snapshot
      ? JSON.parse(order.delivery_address_snapshot)
      : null;
    const block = snapshot?.hostel_block || snapshot?.building || "Other";
    if (!groups[block]) groups[block] = [];
    groups[block].push(order);
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Active Batch Status</CardTitle>
          <CardDescription>
            Closes at {format(new Date(data.activeBatch.cutoff_time), "h:mm a")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAdjustTime(-1)}
                disabled={isPending}
              >
                -1 Hr
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAdjustTime(1)}
                disabled={isPending}
              >
                +1 Hr
              </Button>
            </div>
            <Button
              onClick={handleCloseBatch}
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              Close Batch Now
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {Object.entries(groups).map(([block, orders]) => (
          <div key={block}>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              {block}
              <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {orders.length} orders
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orders.map((order: SerializedOrderWithDetails) => (
                <BatchOrderCard key={order.id} order={order} />
              ))}
            </div>
          </div>
        ))}
        {data.batchOrders.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No orders in this batch yet.
          </div>
        )}
      </div>
    </div>
  );
}
