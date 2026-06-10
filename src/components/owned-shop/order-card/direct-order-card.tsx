"use client";

import { format } from "date-fns";
import { MapPin, Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useAcceptOrder,
  useRejectOrder,
  useStartDirectDelivery,
} from "@/hooks/queries/useBatch";
import { formatCurrency } from "@/lib/utils/currency";
import { SerializedOrderWithDetails } from "@/types";

import { SwipeableOrderCard } from "./swipeable-order-card";

interface DirectOrderCardProps {
  order: SerializedOrderWithDetails;
  onActionComplete?: () => void;
}

export function DirectOrderCard({
  order,
  onActionComplete,
}: DirectOrderCardProps) {
  const acceptMutation = useAcceptOrder();
  const rejectMutation = useRejectOrder();
  const startDirectDeliveryMutation = useStartDirectDelivery();

  const isProcessing =
    acceptMutation.isPending ||
    rejectMutation.isPending ||
    startDirectDeliveryMutation.isPending;

  const isSwipeable = order.order_status === "NEW";

  const handleAccept = () => {
    if (isProcessing) return;
    acceptMutation.mutate(order.id, {
      onSuccess: () => {
        onActionComplete?.();
      },
    });
  };

  const handleReject = () => {
    if (isProcessing) return;
    rejectMutation.mutate(
      { orderId: order.id },
      {
        onSuccess: () => {
          onActionComplete?.();
        },
      }
    );
  };

  const handleStartDelivery = () => {
    if (isProcessing) return;
    startDirectDeliveryMutation.mutate(order.id, {
      onSuccess: () => {
        onActionComplete?.();
      },
    });
  };

  const CardContent = (
    <div className="p-4 md:p-6 flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-lg">{order.display_id}</span>
            {order.order_status === "NEW" && (
              <Badge
                variant="destructive"
                className="bg-red-500/10 text-red-500 border-red-200"
              >
                Direct - New
              </Badge>
            )}
            {order.order_status === "BATCHED" && (
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-600 border-amber-200"
              >
                Accepted - Preparing
              </Badge>
            )}
            {order.order_status === "OUT_FOR_DELIVERY" && (
              <Badge className="bg-blue-500 text-white">Out for Delivery</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {format(new Date(order.created_at), "h:mm a")} •{" "}
            {order.items.length} items
          </p>
        </div>
        <div className="text-right">
          <span className="font-bold text-lg">
            {formatCurrency(order.total_price)}
          </span>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {order.payment_method}
          </p>
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
        <>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="text-sm">
              <span className="font-medium">
                {order.delivery_address_snapshot?.hostel_block ||
                  order.delivery_address_snapshot?.building}
              </span>
              <p className="text-muted-foreground">
                {order.delivery_address_snapshot?.room_number}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {order.user?.phone || "No phone provided"}
            </span>
          </div>
        </>
      </div>

      <div className="space-y-1 mt-2">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="h-5 px-1.5 text-xs font-mono">
                {item.quantity}x
              </Badge>
              <span className="font-medium truncate max-w-[200px]">
                {item.product.name}
              </span>
            </div>
            <span className="text-muted-foreground">
              {formatCurrency(item.price)}
            </span>
          </div>
        ))}
      </div>

      {order.order_status === "BATCHED" && (
        <div className="pt-3 border-t mt-auto flex gap-2">
          <Button
            onClick={handleStartDelivery}
            disabled={isProcessing}
            className="w-full shadow-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white"
          >
            🚀 Dispatch Delivery
          </Button>
        </div>
      )}

      {order.order_status === "OUT_FOR_DELIVERY" && (
        <div className="pt-3 border-t mt-auto">
          <p className="text-xs text-muted-foreground text-center font-medium bg-blue-50 dark:bg-blue-950/10 p-2.5 rounded-lg border border-blue-100 dark:border-blue-900/30">
            Delivery boy is currently delivering this order. Verify OTP in the
            Delivery Run tab.
          </p>
        </div>
      )}
    </div>
  );

  if (!isSwipeable) {
    return (
      <div className="relative w-full rounded-xl mb-3 border bg-card shadow-sm">
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
