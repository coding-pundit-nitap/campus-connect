"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VALID_ORDER_TRANSITIONS } from "@/config/constants";
import { useUpdateShopOrderStatus } from "@/hooks/queries/useOrders";
import { OrderStatus } from "@/types/prisma.types";

type OrderStatusUpdaterProps = {
  orderId: string;
  currentStatus: OrderStatus;
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: "New",
  PREPARING: "Preparing",
  READY_FOR_PICKUP: "Ready for Pickup",
  OUT_FOR_DELIVERY: "Out for Delivery",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export function OrderStatusUpdater({
  orderId,
  currentStatus,
}: OrderStatusUpdaterProps) {
  const { mutate, isPending } = useUpdateShopOrderStatus();

  const validNextStatuses = VALID_ORDER_TRANSITIONS[currentStatus] || [];

  const handleStatusChange = (newStatus: OrderStatus) => {
    mutate({ order_id: orderId, status: newStatus });
  };

  if (validNextStatuses.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {STATUS_LABELS[currentStatus]} (Final)
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        defaultValue={currentStatus}
        onValueChange={(value) => handleStatusChange(value as OrderStatus)}
        disabled={isPending}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Change status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={currentStatus} disabled>
            {STATUS_LABELS[currentStatus]} (Current)
          </SelectItem>
          {validNextStatuses.map((status) => (
            <SelectItem key={status} value={status}>
              {STATUS_LABELS[status as OrderStatus]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isPending && <p className="text-sm">Updating...</p>}
    </div>
  );
}
