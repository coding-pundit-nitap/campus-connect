"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { updateOrderStatusAction } from "@/actions/orders/order-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrderStatus } from "@/types/prisma.types";

type OrderStatusUpdaterProps = {
  orderId: string;
  currentStatus: OrderStatus;
};

export function OrderStatusUpdater({
  orderId,
  currentStatus,
}: OrderStatusUpdaterProps) {
  const [isPending, startTransition] = useTransition();
  const allStatuses = Object.values(OrderStatus);

  const handleStatusChange = (newStatus: OrderStatus) => {
    startTransition(async () => {
      const response = await updateOrderStatusAction({
        order_id: orderId,
        status: newStatus,
      });
      if (response.success) {
        toast.success(response.details);
      } else {
        toast.error(response.details || "Failed to update order status.");
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        defaultValue={currentStatus}
        onValueChange={(value) => handleStatusChange(value as OrderStatus)}
        disabled={isPending}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Change status" />
        </SelectTrigger>
        <SelectContent>
          {allStatuses.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isPending && <p>Updating...</p>}
    </div>
  );
}
