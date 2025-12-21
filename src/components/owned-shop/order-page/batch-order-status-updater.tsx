"use client";

import { Loader2, Send } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/cn";
import { OrderStatus } from "@/types/prisma.types";

type BatchOrderStatusUpdaterProps = {
  onUpdate: (status: OrderStatus) => void;
  isUpdating: boolean;
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: "New",
  PREPARING: "Preparing",
  READY_FOR_PICKUP: "Ready for Pickup",
  OUT_FOR_DELIVERY: "Out for Delivery",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const ACTIONABLE_STATUSES: OrderStatus[] = [
  OrderStatus.PREPARING,
  OrderStatus.READY_FOR_PICKUP,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
];

export function BatchOrderStatusUpdater({
  onUpdate,
  isUpdating,
}: BatchOrderStatusUpdaterProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(
    null
  );

  const handleUpdate = () => {
    if (selectedStatus) {
      onUpdate(selectedStatus);
      setSelectedStatus(null);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
      <Select
        value={selectedStatus ?? ""}
        onValueChange={(value) => setSelectedStatus(value as OrderStatus)}
        disabled={isUpdating}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          {ACTIONABLE_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        onClick={handleUpdate}
        disabled={!selectedStatus || isUpdating}
        className={cn(
          "gap-2 transition-all",
          selectedStatus && !isUpdating && "bg-primary hover:bg-primary/90"
        )}
      >
        {isUpdating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Updating...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Apply Status
          </>
        )}
      </Button>
    </div>
  );
}
