"use client";

import { OrderStatus } from "@prisma/client";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type BatchOrderStatusUpdaterProps = {
  onUpdate: (status: OrderStatus) => void;
  isUpdating: boolean;
};

export function BatchOrderStatusUpdater({
  onUpdate,
  isUpdating,
}: BatchOrderStatusUpdaterProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(
    null
  );
  const allStatuses = Object.values(OrderStatus);

  const handleUpdate = () => {
    if (selectedStatus) {
      onUpdate(selectedStatus);
    }
  };

  return (
    <div className="flex items-center gap-2 p-4 rounded-lg">
      <Select
        onValueChange={(value) => setSelectedStatus(value as OrderStatus)}
        disabled={isUpdating}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select new status" />
        </SelectTrigger>
        <SelectContent>
          {allStatuses.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={handleUpdate} disabled={!selectedStatus || isUpdating}>
        {isUpdating ? "Updating..." : "Apply to Selected"}
      </Button>
    </div>
  );
}
