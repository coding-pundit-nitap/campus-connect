"use client";

import { OrderStatus, PaymentStatus } from "@prisma/client";
import {
  Calendar,
  CreditCard,
  MapPin,
  Package,
  ShoppingBag,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { SerializedOrderWithDetails } from "@/types";

interface OrderDetailsDialogProps {
  order: SerializedOrderWithDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailsDialog({
  order,
  open,
  onOpenChange,
}: OrderDetailsDialogProps) {
  const getOrderStatusBadge = (status: OrderStatus) => {
    const variants: Record<
      OrderStatus,
      "default" | "outline" | "secondary" | "destructive" | null | undefined
    > = {
      NEW: "default",
      PREPARING: "outline",
      READY_FOR_PICKUP: "secondary",
      OUT_FOR_DELIVERY: "outline",
      COMPLETED: "default",
      CANCELLED: "destructive",
    };
    const colors: Record<OrderStatus, string> = {
      NEW: "bg-blue-500",
      PREPARING: "bg-yellow-500",
      READY_FOR_PICKUP: "bg-purple-500",
      OUT_FOR_DELIVERY: "bg-indigo-500",
      COMPLETED: "bg-green-500",
      CANCELLED: "bg-red-500",
    };
    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {status.replace(/_/g, " ")}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    const variants: Record<
      PaymentStatus,
      "default" | "outline" | "secondary" | "destructive" | null | undefined
    > = {
      PENDING: "outline",
      PROCESSING: "outline",
      COMPLETED: "default",
      FAILED: "destructive",
      REFUNDED: "secondary",
      CANCELLED: "destructive",
    };
    const colors: Record<PaymentStatus, string> = {
      PENDING: "bg-gray-500",
      PROCESSING: "bg-blue-500",
      COMPLETED: "bg-green-500",
      FAILED: "bg-red-500",
      REFUNDED: "bg-orange-500",
      CANCELLED: "bg-red-500",
    };
    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {status}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order Details #{order.display_id}</DialogTitle>
          <DialogDescription>
            Complete information about this order
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Package className="h-4 w-4" />
                Order Status
              </div>
              {getOrderStatusBadge(order.order_status)}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                Payment Status
              </div>
              <div className="flex flex-col gap-1">
                {getPaymentStatusBadge(order.payment_status)}
                <span className="text-xs text-muted-foreground">
                  Method: {order.payment_method}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Customer Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Name</p>
                <p className="font-medium">{order.user?.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p className="font-medium">{order.user?.phone || "N/A"}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Shop Information
            </h3>
            <div className="text-sm">
              <p className="font-medium">{order.shop.name}</p>
              <p className="text-muted-foreground">{order.shop.location}</p>
            </div>
          </div>

          <Separator />

          {order.delivery_address_id && (
            <>
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Delivery Address
                </h3>
                <div className="text-sm space-y-1">
                  <p className="text-muted-foreground">
                    Address ID: {order.delivery_address_id}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {order.delivery_address_snapshot}
                  </p>
                </div>
              </div>
              <Separator />
            </>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold">Order Items</h3>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.product.category?.name || "Uncategorized"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{item.price}</p>
                    <p className="text-sm text-muted-foreground">
                      Total: ₹{Number(item.quantity) * Number(item.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="font-semibold">Order Summary</h3>
            <div className="space-y-1">
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount</span>
                <span>₹{order.total_price}</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Order Placed</p>
                <p className="font-medium">
                  {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
              {order.requested_delivery_time && (
                <div>
                  <p className="text-muted-foreground">Requested Delivery</p>
                  <p className="font-medium">
                    {new Date(order.requested_delivery_time).toLocaleString()}
                  </p>
                </div>
              )}
              {order.estimated_delivery_time && (
                <div>
                  <p className="text-muted-foreground">Estimated Delivery</p>
                  <p className="font-medium">
                    {new Date(order.estimated_delivery_time).toLocaleString()}
                  </p>
                </div>
              )}
              {order.actual_delivery_time && (
                <div>
                  <p className="text-muted-foreground">Actual Delivery</p>
                  <p className="font-medium">
                    {new Date(order.actual_delivery_time).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {order.pg_payment_id && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Payment ID</p>
                <p className="font-mono text-sm">{order.pg_payment_id}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
