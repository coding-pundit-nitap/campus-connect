import { Calendar, ChevronRight, Hash, Package, User } from "lucide-react";
import Link from "next/link";

import { DateDisplay } from "@/components/shared/date-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    bg: "bg-blue-100 dark:bg-blue-900/40",
    text: "text-blue-800 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
  BATCHED: {
    bg: "bg-orange-100 dark:bg-orange-900/40",
    text: "text-orange-800 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-800",
  },
  OUT_FOR_DELIVERY: {
    bg: "bg-purple-100 dark:bg-purple-900/40",
    text: "text-purple-800 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
  },
  COMPLETED: {
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
    text: "text-emerald-800 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  CANCELLED: {
    bg: "bg-red-100 dark:bg-red-900/40",
    text: "text-red-800 dark:text-red-300",
    border: "border-red-200 dark:border-red-800",
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

  return (
    <div
      ref={lastElementRef}
      className={cn(
        "group flex items-start gap-4 p-4 border-b border-border transition-all duration-200 hover:bg-muted/30",
        isSelected &&
          "bg-primary/5 border-l-4 border-l-primary border-b-primary/20"
      )}
    >
      <div className="pt-1 shrink-0">
        <Checkbox
          checked={isSelected}
          onChange={(checked) => onSelectionChange(order.id, !!checked)}
          aria-label={`Select order ${order.display_id}`}
          className="transition-transform group-hover:scale-105 shadow-sm"
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-base leading-none">
              #{order.display_id}
            </span>
            <Badge
              variant="outline"
              className={cn(
                "gap-1 font-medium text-xs px-2 py-0 border",
                badgeStyle.bg,
                badgeStyle.text,
                badgeStyle.border
              )}
            >
              <statusInfo.Icon className="h-3 w-3" />
              {statusInfo.label}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <DateDisplay date={order.created_at} />
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span className="font-medium text-foreground">
                {order.user.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Package className="h-3.5 w-3.5" />
              <span>
                {order.items.length}{" "}
                {order.items.length === 1 ? "item" : "items"}
              </span>
            </div>
          </div>

          {order.payment_method === PaymentMethod.ONLINE &&
            order.upi_transaction_id && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <Hash className="h-3 w-3" />
                <span>UPI:</span>
                <code className="font-mono bg-muted/50 px-1.5 py-0.5 rounded border">
                  {order.upi_transaction_id}
                </code>
              </div>
            )}
        </div>

        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
          <p className="font-bold text-lg text-green-600 dark:text-green-500">
            ₹{order.total_price.toFixed(2)}
          </p>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-muted-foreground hover:text-foreground group/btn"
          >
            <Link href={`/owner-shops/orders/${order.id}`}>
              Details
              <ChevronRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
