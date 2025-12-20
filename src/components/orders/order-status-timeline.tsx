"use client";

import {
  Bike,
  CheckCircle2,
  CircleDot,
  CookingPot,
  Package,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/cn";
import { OrderStatus } from "@/types/prisma.types";

import { SharedCard } from "../shared/shared-card";

interface OrderStatusTimelineProps {
  currentStatus: OrderStatus;
  className?: string;
}

const statusSteps = [
  {
    status: OrderStatus.NEW,
    label: "Order Placed",
    description: "Your order has been received",
    icon: CircleDot,
  },
  {
    status: OrderStatus.PREPARING,
    label: "Preparing",
    description: "Seller is preparing your order",
    icon: CookingPot,
  },
  {
    status: OrderStatus.READY_FOR_PICKUP,
    label: "Ready for Pickup",
    description: "Order is ready to be picked up",
    icon: Package,
  },
  {
    status: OrderStatus.OUT_FOR_DELIVERY,
    label: "Out for Delivery",
    description: "Order is on its way to you",
    icon: Bike,
  },
  {
    status: OrderStatus.COMPLETED,
    label: "Completed",
    description: "Order has been delivered",
    icon: CheckCircle2,
  },
];

function getStatusIndex(status: OrderStatus): number {
  return statusSteps.findIndex((step) => step.status === status);
}

export function OrderStatusTimeline({
  currentStatus,
  className,
}: OrderStatusTimelineProps) {
  const isCancelled = currentStatus === OrderStatus.CANCELLED;
  const currentIndex = isCancelled ? -1 : getStatusIndex(currentStatus);

  if (isCancelled) {
    return (
      <SharedCard
        className={cn("border-red-200 dark:border-red-900", className)}
        contentClassName="py-4"
      >
        <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
          <XCircle className="h-8 w-8 text-red-500 shrink-0" />
          <div>
            <p className="font-semibold text-red-700 dark:text-red-400">
              Order Cancelled
            </p>
            <p className="text-sm text-red-600 dark:text-red-500">
              This order has been cancelled and cannot be processed further.
            </p>
          </div>
        </div>
      </SharedCard>
    );
  }

  return (
    <SharedCard headerClassName={className} showHeader title="Order Progress">
      <div className="hidden md:block">
        <div className="relative flex items-start justify-between">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted-foreground/20" />
          <div
            className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
            style={{
              width: `${(currentIndex / (statusSteps.length - 1)) * 100}%`,
            }}
          />

          {statusSteps.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isPending = index > currentIndex;

            return (
              <div
                key={step.status}
                className="relative flex flex-col items-center flex-1"
              >
                <div
                  className={cn(
                    "relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
                    isCompleted &&
                      "bg-primary border-primary text-primary-foreground",
                    isCurrent &&
                      "bg-primary/10 border-primary text-primary scale-110 ring-4 ring-primary/20",
                    isPending &&
                      "bg-background border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <StepIcon className="w-5 h-5" />
                  )}
                </div>
                <div className="mt-3 text-center max-w-[100px]">
                  <p
                    className={cn(
                      "text-xs font-medium transition-colors",
                      (isCompleted || isCurrent) && "text-primary",
                      isPending && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                  {isCurrent && (
                    <p className="text-xs text-muted-foreground mt-1 hidden lg:block">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="md:hidden space-y-0">
        {statusSteps.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;
          const isLast = index === statusSteps.length - 1;

          return (
            <div key={step.status} className="relative flex gap-3">
              {!isLast && (
                <div
                  className={cn(
                    "absolute left-[19px] top-10 w-0.5 h-[calc(100%-16px)]",
                    isCompleted ? "bg-primary" : "bg-muted-foreground/20"
                  )}
                />
              )}

              <div
                className={cn(
                  "relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 shrink-0 transition-all duration-300",
                  isCompleted &&
                    "bg-primary border-primary text-primary-foreground",
                  isCurrent &&
                    "bg-primary/10 border-primary text-primary scale-110",
                  isPending &&
                    "bg-background border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <StepIcon className="w-5 h-5" />
                )}
              </div>

              <div className="pb-6 pt-1">
                <p
                  className={cn(
                    "text-sm font-medium transition-colors",
                    (isCompleted || isCurrent) && "text-foreground",
                    isPending && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </p>
                <p
                  className={cn(
                    "text-xs transition-colors",
                    isCurrent
                      ? "text-muted-foreground"
                      : "text-muted-foreground/60"
                  )}
                >
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </SharedCard>
  );
}
