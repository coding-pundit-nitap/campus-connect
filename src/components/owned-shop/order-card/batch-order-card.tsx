"use client";

import { format } from "date-fns";
import { CheckCircle, Clock, Package } from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { useAcceptOrder, useRejectOrder } from "@/hooks/queries/useBatch";
import { formatCurrency } from "@/lib/utils/currency";
import { SerializedOrderWithDetails } from "@/types";

import { SwipeableOrderCard } from "./swipeable-order-card";

interface BatchOrderCardProps {
  order: SerializedOrderWithDetails;
  onActionComplete?: () => void;
}

export function BatchOrderCard({
  order,
  onActionComplete,
}: BatchOrderCardProps) {
  const acceptMutation = useAcceptOrder();
  const rejectMutation = useRejectOrder();

  const isProcessing = acceptMutation.isPending || rejectMutation.isPending;
  const isSwipeable = order.order_status === "NEW";

  const handleAccept = () => {
    if (isProcessing || !isSwipeable) return;
    acceptMutation.mutate(order.id, {
      onSuccess: () => {
        onActionComplete?.();
      },
    });
  };

  const handleReject = () => {
    if (isProcessing || !isSwipeable) return;
    rejectMutation.mutate(
      { orderId: order.id },
      {
        onSuccess: () => {
          onActionComplete?.();
        },
      }
    );
  };

  const CardContent = (
    <div className="p-4 flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold">{order.display_id}</span>
            {order.order_status === "BATCHED" && (
              <Badge
                variant="secondary"
                className="bg-blue-50 text-blue-600 border-blue-200"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Accepted
              </Badge>
            )}
            {order.order_status === "NEW" && (
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-600 border-amber-200"
              >
                New Order
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <Clock className="h-3 w-3" />
            {format(new Date(order.created_at), "h:mm a")}
          </p>
        </div>
        <div className="text-right">
          <span className="font-semibold text-sm">
            {formatCurrency(order.total_price)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground border-t pt-2 mt-1">
        <Package className="h-4 w-4" />
        <span className="truncate">
          {order.items
            .map((i) => `${i.quantity}x ${i.product.name}`)
            .join(", ")}
        </span>
      </div>
    </div>
  );

  if (!isSwipeable) {
    return (
      <div className="relative w-full rounded-xl mb-3 border bg-card/50 opacity-80 transition-opacity hover:opacity-100">
        {CardContent}
      </div>
    );
  }

  return (
    <SwipeableOrderCard onAccept={handleAccept} onReject={handleReject}>
      {CardContent}
    </SwipeableOrderCard>
  );
}
