import { Calendar, ChevronRight, Hash, Package, User } from "lucide-react";
import Link from "next/link";

import { DateDisplay } from "@/components/shared/date-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/cn";
import { getOrderStatusInfo } from "@/lib/utils/order.utils";
import { SerializedOrderWithDetails } from "@/types";
import { OrderStatus, PaymentMethod } from "@/types/prisma.types";

type Props = {
  order: SerializedOrderWithDetails;
  isSelected: boolean;
  onSelectionChange: (orderId: string, isSelected: boolean) => void;
  lastElementRef?: (node: HTMLDivElement | null) => void;
};

const STATUS_BADGE_VARIANTS: Record<
  OrderStatus,
  { bg: string; text: string; border: string }
> = {
  NEW: {
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/20",
  },
  BATCHED: {
    bg: "bg-orange-500/10",
    text: "text-orange-600 dark:text-orange-400",
    border: "border-orange-500/20",
  },
  OUT_FOR_DELIVERY: {
    bg: "bg-purple-500/10",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-500/20",
  },
  COMPLETED: {
    bg: "bg-green-500/10",
    text: "text-green-600 dark:text-green-400",
    border: "border-green-500/20",
  },
  CANCELLED: {
    bg: "bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-500/20",
  },
};

export default function OrderCard({
  order,
  isSelected,
  onSelectionChange,
  lastElementRef,
}: Props) {
  const statusInfo = getOrderStatusInfo(order.order_status);
  const badgeStyle = STATUS_BADGE_VARIANTS[order.order_status];

  const subtotal = order.items.reduce((acc, item) => {
    return (
      acc +
      (item.price - (item.price * (item.product.discount || 0)) / 100) *
        item.quantity
    );
  }, 0);

  return (
    <Card
      ref={lastElementRef}
      className={cn(
        "transition-all duration-200 hover:shadow-lg hover:border-primary/30 group",
        isSelected && "ring-2 ring-primary border-primary bg-primary/5"
      )}
    >
      <CardContent className="p-0">
        <div className="flex gap-4 p-4">
          <div className="flex items-start pt-1">
            <Checkbox
              checked={isSelected}
              onChange={(e) => onSelectionChange(order.id, e.target.checked)}
              aria-label={`Select order ${order.display_id}`}
              className="transition-transform group-hover:scale-105"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-bold text-lg">#{order.display_id}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "gap-1.5 font-medium",
                      badgeStyle.bg,
                      badgeStyle.text,
                      badgeStyle.border
                    )}
                  >
                    <statusInfo.Icon className="h-3.5 w-3.5" />
                    {statusInfo.label}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <DateDisplay date={order.created_at} />
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{order.user.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span>
                      {order.items.length}{" "}
                      {order.items.length === 1 ? "item" : "items"}
                    </span>
                  </div>
                </div>

                {order.payment_method === PaymentMethod.ONLINE &&
                  order.upi_transaction_id && (
                    <div className="flex items-center gap-2 text-sm">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">UPI:</span>
                      <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                        {order.upi_transaction_id}
                      </code>
                    </div>
                  )}
              </div>

              <div className="flex items-center gap-6 lg:flex-col lg:items-end lg:gap-2">
                <p className="font-bold text-xl">₹{subtotal.toFixed(2)}</p>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="group/btn hover:bg-primary hover:text-primary-foreground"
                >
                  <Link
                    href={`/owner-shops/orders/${order.id}`}
                    className="flex items-center gap-1"
                  >
                    View Details
                    <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
