"use client";

import {
  CheckCircle2,
  CircleDot,
  CookingPot,
  Loader2,
  Lock,
  Package,
  XCircle,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VALID_ORDER_TRANSITIONS } from "@/config/constants";
import { useUpdateShopOrderStatus } from "@/hooks/queries/useOrders";
import { cn } from "@/lib/cn";
import { OrderStatus } from "@/types/prisma.types";

type OrderStatusUpdaterProps = {
  orderId: string;
  currentStatus: OrderStatus;
};

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; icon: typeof CircleDot; color: string; bg: string }
> = {
  NEW: {
    label: "New",
    icon: CircleDot,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/40",
  },
  BATCHED: {
    label: "Batched",
    icon: CookingPot,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-900/40",
  },
  OUT_FOR_DELIVERY: {
    label: "Out for Delivery",
    icon: Package,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/40",
  },
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/40",
  },
};

export function OrderStatusUpdater({
  orderId,
  currentStatus,
}: OrderStatusUpdaterProps) {
  const { mutate, isPending } = useUpdateShopOrderStatus();

  const validNextStatuses = VALID_ORDER_TRANSITIONS[currentStatus] || [];
  const currentConfig = STATUS_CONFIG[currentStatus];
  const CurrentIcon = currentConfig.icon;

  const handleStatusChange = (newStatus: OrderStatus) => {
    mutate({ order_id: orderId, status: newStatus });
  };

  if (validNextStatuses.length === 0) {
    return (
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md border shadow-sm",
            currentConfig.bg,
            currentConfig.color,
            "border-current/20"
          )}
        >
          <CurrentIcon className="h-4 w-4" />
          <span className="font-medium text-sm">{currentConfig.label}</span>
        </div>
        <div className="flex items-center text-xs text-muted-foreground gap-1.5">
          <Lock className="h-3 w-3" />
          <span>Final State</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 w-full sm:w-auto">
      <Select
        defaultValue={currentStatus}
        onValueChange={(value) => handleStatusChange(value as OrderStatus)}
        disabled={isPending}
      >
        <SelectTrigger
          className={cn(
            "w-full sm:w-60 h-10 bg-background border-muted-foreground/30 shadow-sm focus:ring-1 focus:ring-primary transition-all",
            isPending && "opacity-60"
          )}
        >
          <SelectValue placeholder="Change status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={currentStatus} disabled>
            <div className="flex items-center gap-2 opacity-80">
              <CurrentIcon className={cn("h-4 w-4", currentConfig.color)} />
              <span className="font-medium">
                {currentConfig.label} (Current)
              </span>
            </div>
          </SelectItem>
          {validNextStatuses.map((status) => {
            const config = STATUS_CONFIG[status as OrderStatus];
            const Icon = config.icon;
            return (
              <SelectItem
                key={status}
                value={status}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-4 w-4", config.color)} />
                  <span className="font-medium">{config.label}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {/* Replaced text with a cleaner spinner */}
      {isPending && (
        <div className="flex items-center text-sm font-medium text-muted-foreground gap-2 animate-in fade-in duration-200">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>Updating...</span>
        </div>
      )}
    </div>
  );
}
