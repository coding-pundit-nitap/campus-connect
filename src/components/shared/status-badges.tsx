import { OrderStatus, PaymentStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
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
}

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  paymentMethod?: string;
  showMethod?: boolean;
}

export function PaymentStatusBadge({
  status,
  paymentMethod,
  showMethod = false,
}: PaymentStatusBadgeProps) {
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
    <div className="flex flex-col gap-1">
      <Badge variant={variants[status]} className={colors[status]}>
        {status}
      </Badge>
      {showMethod && paymentMethod && (
        <span className="text-xs text-muted-foreground">{paymentMethod}</span>
      )}
    </div>
  );
}
