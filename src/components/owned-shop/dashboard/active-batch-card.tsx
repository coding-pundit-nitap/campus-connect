"use client";

import {
  AlertTriangle,
  Check,
  ChevronRight,
  Clock,
  MapPin,
  Navigation,
  Package,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";
import { useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Progress } from "@/components/ui/progress";
import {
  useCancelBatch,
  useCompleteBatch,
  useStartDelivery,
  useVerifyOtp,
} from "@/hooks/queries/useBatch";
import { cn } from "@/lib/cn";
import { BatchInfo, BatchSummaryItem } from "@/services/batch";

// --- Sub-Component: Shopping List (Accordion style) ---
function ShoppingListAccordion({ items }: { items: BatchSummaryItem[] }) {
  return (
    <Accordion
      type="single"
      collapsible
      className="w-full border rounded-lg bg-background shadow-sm"
    >
      <AccordionItem value="items" className="border-b-0">
        <AccordionTrigger className="px-4 py-3 hover:no-underline">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium">Shopping List</span>
            <Badge variant="secondary" className="ml-2 text-xs">
              {items.length} items
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="grid gap-2">
            {items.map((item) => (
              <div
                key={item.product_id}
                className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded"
              >
                <span className="font-medium">{item.name}</span>
                <span className="font-mono bg-background border px-2 py-0.5 rounded text-xs">
                  x{item.quantity}
                </span>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

// --- Sub-Component: Delivery Checklist ---
function DeliveryChecklist({
  batchId,
  orders,
}: {
  batchId: string;
  orders?: BatchInfo["orders"];
}) {
  const [otpValues, setOtpValues] = useState<Record<string, string>>({});
  const verifyOtp = useVerifyOtp();

  // Sort: Pending first, then Completed
  const sortedOrders = [...(orders || [])].sort((a, b) => {
    if (a.status === "COMPLETED" && b.status !== "COMPLETED") return 1;
    if (a.status !== "COMPLETED" && b.status === "COMPLETED") return -1;
    // Secondary sort by hostel block to group physically
    return (a.delivery_address?.hostel_block || "").localeCompare(
      b.delivery_address?.hostel_block || ""
    );
  });

  const completedCount =
    orders?.filter(
      (o) =>
        o.status === "COMPLETED" ||
        (otpValues[o.id]?.length === 4 && verifyOtp.isSuccess)
    ).length || 0;
  const totalCount = orders?.length || 0;
  const progress = (completedCount / totalCount) * 100;

  const handleVerify = (orderId: string) => {
    const otp = otpValues[orderId];
    if (otp?.length === 4) verifyOtp.mutate({ orderId, otp });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-muted-foreground">
          Delivery Progress
        </span>
        <span className="font-mono text-xs">
          {completedCount}/{totalCount}
        </span>
      </div>
      <Progress value={progress} className="h-2" />

      <div className="space-y-3 mt-4">
        {sortedOrders.map((order) => {
          const isCompleted = order.status === "COMPLETED"; // Assuming backend updates this
          const address = order.delivery_address;
          const currentOtp = otpValues[order.id] || "";

          if (isCompleted) return null; // Hide completed to clean up view? Or show dimmed:

          return (
            <div
              key={order.id}
              className={cn(
                "p-4 rounded-xl border transition-all",
                isCompleted
                  ? "bg-muted/50 border-transparent opacity-60"
                  : "bg-background border-border shadow-sm"
              )}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-3">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full h-fit">
                    <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg leading-none mb-1">
                      {address
                        ? `${address.hostel_block} - ${address.room_number}`
                        : "No Location"}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {address?.building}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="font-mono">
                  #{order.display_id}
                </Badge>
              </div>

              {!isCompleted && (
                <div className="flex gap-2 items-center">
                  <InputOTP
                    maxLength={4}
                    value={currentOtp}
                    onChange={(val) =>
                      setOtpValues((prev) => ({ ...prev, [order.id]: val }))
                    }
                  >
                    <InputOTPGroup className="w-full bg-background">
                      <InputOTPSlot
                        index={0}
                        className="h-10 w-10 sm:h-12 sm:w-12 border-muted-foreground/30"
                      />
                      <InputOTPSlot
                        index={1}
                        className="h-10 w-10 sm:h-12 sm:w-12 border-muted-foreground/30"
                      />
                      <InputOTPSlot
                        index={2}
                        className="h-10 w-10 sm:h-12 sm:w-12 border-muted-foreground/30"
                      />
                      <InputOTPSlot
                        index={3}
                        className="h-10 w-10 sm:h-12 sm:w-12 border-muted-foreground/30"
                      />
                    </InputOTPGroup>
                  </InputOTP>
                  <Button
                    size="icon"
                    className={cn(
                      "h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-lg",
                      currentOtp.length === 4
                        ? "bg-green-600 hover:bg-green-700 animate-pulse"
                        : "bg-muted text-muted-foreground hover:bg-muted"
                    )}
                    disabled={currentOtp.length < 4 || verifyOtp.isPending}
                    onClick={() => handleVerify(order.id)}
                  >
                    <Check className="h-6 w-6" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
        {completedCount === totalCount && totalCount > 0 && (
          <div className="text-center py-8 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
            <Check className="h-10 w-10 text-green-600 mx-auto mb-2" />
            <p className="text-green-800 dark:text-green-300 font-medium">
              All orders delivered!
            </p>
            <p className="text-xs text-green-700/70">
              Complete the batch below to get paid.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Main Component ---
export function ActiveBatchCard({ batch }: { batch: BatchInfo }) {
  const startDelivery = useStartDelivery();
  const completeBatch = useCompleteBatch();
  const formattedTime = new Date(batch.cutoff_time).toLocaleTimeString(
    "en-IN",
    { hour: "2-digit", minute: "2-digit" }
  );

  const isPrep = batch.status === "LOCKED";
  const isInTransit = batch.status === "IN_TRANSIT";

  // Visual Config
  const variants = {
    LOCKED: {
      color: "border-l-4 border-l-amber-500",
      badge:
        "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
      icon: Package,
    },
    IN_TRANSIT: {
      color: "border-l-4 border-l-blue-500",
      badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
      icon: Truck,
    },
  };
  const ui = variants[batch.status as keyof typeof variants] || variants.LOCKED;
  const StatusIcon = ui.icon;

  return (
    <Card className={cn("overflow-hidden shadow-md", ui.color)}>
      <div className="bg-muted/30 p-4 flex justify-between items-start border-b">
        <div className="flex gap-3">
          <div className={cn("p-2 rounded-lg h-fit", ui.badge)}>
            <StatusIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg">
              {isPrep ? "Preparation Phase" : "Delivery Phase"}
            </h3>
            <div className="flex items-center text-xs text-muted-foreground gap-2 mt-1">
              <Clock className="h-3 w-3" />
              <span>Cutoff: {formattedTime}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-green-600">
            ₹{batch.total_earnings.toFixed(0)}
          </div>
          <div className="text-xs text-muted-foreground">
            {batch.order_count} Orders
          </div>
        </div>
      </div>

      <CardContent className="p-4 space-y-6">
        {/* Step 1: Shopping List (Always show, but emphasized in Prep) */}
        {batch.item_summary && batch.item_summary.length > 0 && (
          <ShoppingListAccordion items={batch.item_summary} />
        )}

        {/* Step 2: Delivery Logic */}
        {isInTransit && (
          <DeliveryChecklist batchId={batch.id} orders={batch.orders} />
        )}
      </CardContent>

      <CardFooter className="p-4 bg-muted/20 border-t">
        {isPrep ? (
          <Button
            className="w-full text-base h-12 shadow-md bg-blue-600 hover:bg-blue-700"
            onClick={() => startDelivery.mutate(batch.id)}
            disabled={startDelivery.isPending}
          >
            <Navigation className="mr-2 h-4 w-4" /> Start Delivery Route
          </Button>
        ) : (
          <Button
            className="w-full text-base h-12 shadow-md bg-green-600 hover:bg-green-700"
            onClick={() => completeBatch.mutate(batch.id)}
            disabled={completeBatch.isPending}
          >
            <Check className="mr-2 h-4 w-4" /> Finish & Collect Earnings
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
