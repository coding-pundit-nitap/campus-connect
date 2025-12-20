"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrderStatus } from "@/types/prisma.types";

type BatchOrderStatusUpdaterProps = {
  onUpdate: (status: OrderStatus) => void;
  isUpdating: boolean;
  selectedOrderStatuses?: OrderStatus[];
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
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-center gap-2 p-4 rounded-lg">
      <Select
        onValueChange={(value) => setSelectedStatus(value as OrderStatus)}
        disabled={isUpdating}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select new status" />
        </SelectTrigger>
        <SelectContent>
          {ACTIONABLE_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={handleUpdate} disabled={!selectedStatus || isUpdating}>
        {isUpdating ? "Updating..." : "Apply to Selected"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Note: Only orders with valid transitions will be updated
      </p>
    </div>
  );
}
