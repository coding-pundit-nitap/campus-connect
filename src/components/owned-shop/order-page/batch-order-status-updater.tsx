"use client";

import { Check, Loader2 } from "lucide-react";
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
  BATCHED: "Batched",
  OUT_FOR_DELIVERY: "Out for Delivery",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const ACTIONABLE_STATUSES: OrderStatus[] = [
  OrderStatus.BATCHED,
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
    <div className="flex items-center gap-2">
      <Select
        value={selectedStatus ?? ""}
        onValueChange={(value) => setSelectedStatus(value as OrderStatus)}
        disabled={isUpdating}
      >
        <SelectTrigger className="h-9 w-32.5 sm:w-40 bg-background border-muted-foreground/30 shadow-sm focus:ring-1 focus:ring-primary">
          <SelectValue placeholder="Set status..." />
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
        size="sm"
        onClick={handleUpdate}
        disabled={!selectedStatus || isUpdating}
        className={cn(
          "h-9 px-3 transition-all shadow-sm",
          selectedStatus && !isUpdating
            ? "bg-primary hover:bg-primary/90 text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted"
        )}
      >
        {isUpdating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        <span className="hidden sm:inline-block ml-1.5 font-medium">
          {isUpdating ? "Saving..." : "Apply"}
        </span>
      </Button>
    </div>
  );
}
