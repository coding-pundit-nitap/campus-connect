"use client";

import { Bike, CheckCircle2, CircleDot, Package, XCircle } from "lucide-react";

import { cn } from "@/lib/cn";
import { OrderStatus } from "@/types/prisma.types";

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
    status: OrderStatus.BATCHED,
    label: "Batched",
    description: "Order has been batched for delivery",
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
      <div
        className={cn(
          "rounded-xl border border-red-500/20 bg-red-500/5 dark:bg-red-950/20 shadow-xs p-4",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <XCircle className="h-8 w-8 text-red-500 shrink-0 animate-pulse" />
          <div>
            <p className="font-heading font-black text-red-700 dark:text-red-400">
              Order Cancelled
            </p>
            <p className="text-sm text-red-600/80 dark:text-red-400/80">
              This order has been cancelled and cannot be processed further.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-muted/20 shadow-xs p-5 space-y-5",
        className
      )}
    >
      <h3 className="font-heading font-black text-xs uppercase tracking-wider text-muted-foreground/90">
        Order Progress
      </h3>
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
                      "bg-orange-500/10 border-orange-500 text-orange-500 scale-110 ring-4 ring-orange-500/20",
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
                <div className="mt-3 text-center max-w-25">
                  <p
                    className={cn(
                      "text-xs font-semibold transition-colors",
                      isCompleted && "text-primary",
                      isCurrent && "text-orange-500",
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
                    "absolute left-4.75 top-10 w-0.5 h-[calc(100%-16px)]",
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
                    "bg-orange-500/10 border-orange-500 text-orange-500 scale-110 ring-4 ring-orange-500/20",
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
                    "text-sm font-semibold transition-colors",
                    isCompleted && "text-foreground",
                    isCurrent && "text-orange-500",
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
    </div>
  );
}
