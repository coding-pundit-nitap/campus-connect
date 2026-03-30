"use client";

import {
  AlertTriangle,
  Check,
  Clock,
  Lock,
  LockOpen,
  MapPin,
  Navigation,
  Package,
  Phone,
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
  useLockBatch,
  useStartDelivery,
  useUnlockBatch,
  useVerifyOtp,
} from "@/hooks/queries/useBatch";
import { cn } from "@/lib/cn";
import { BatchInfo, BatchSummaryItem } from "@/services/batch";

// --- Sub-Component: Shopping List ---
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

// --- Sub-Component: Cancel Batch Dialog ---
function CancelBatchDialog({
  batchId,
  orderCount,
}: {
  batchId: string;
  orderCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const cancelBatch = useCancelBatch();

  const handleCancel = () => {
    if (!reason.trim()) return;
    cancelBatch.mutate(
      { batchId, reason },
      {
        onSuccess: () => {
          setOpen(false);
          setReason("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
        >
          <X className="h-3.5 w-3.5" />
          Cancel Batch
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Cancel Batch?
          </DialogTitle>
          <DialogDescription>
            This will cancel <strong>{orderCount} orders</strong> and trigger
            refunds. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <label className="text-sm font-medium">
            Reason for cancellation <span className="text-destructive">*</span>
          </label>
          <Input
            placeholder="e.g. Item out of stock, unable to fulfill..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Go Back
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={!reason.trim() || cancelBatch.isPending}
          >
            {cancelBatch.isPending ? "Cancelling..." : "Yes, Cancel Batch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Sub-Component: Unlock Batch Dialog ---
function UnlockBatchDialog({ batchId }: { batchId: string }) {
  const [open, setOpen] = useState(false);
  const unlockBatch = useUnlockBatch();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 border-amber-400 text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-900/20 gap-1.5"
        >
          <LockOpen className="h-3.5 w-3.5" />
          Unlock Batch
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LockOpen className="h-5 w-5 text-amber-600" />
            Unlock Batch?
          </DialogTitle>
          <DialogDescription>
            This will reopen the batch so new orders can be added. OTPs for
            existing orders will be regenerated when you lock again.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            className="bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() =>
              unlockBatch.mutate(batchId, { onSuccess: () => setOpen(false) })
            }
            disabled={unlockBatch.isPending}
          >
            {unlockBatch.isPending ? "Unlocking..." : "Yes, Unlock"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Sub-Component: Open Batch Order Summary ---
function OpenOrderList({ orders }: { orders?: BatchInfo["orders"] }) {
  if (!orders || orders.length === 0) return null;

  const grouped = orders.reduce<
    Record<string, NonNullable<BatchInfo["orders"]>>
  >((acc, order) => {
    const block = order.delivery_address?.hostel_block || "Other";
    if (!acc[block]) acc[block] = [];
    acc[block].push(order);
    return acc;
  }, {});
  const sortedBlocks = Object.keys(grouped).sort();

  return (
    <div className="space-y-3">
      {sortedBlocks.map((block) => (
        <div key={block}>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-muted px-3 py-1 rounded-full flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                Block {block}
              </span>
            </div>
          </div>
          <div className="space-y-1.5 pl-1">
            {grouped[block].map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40 text-sm"
              >
                <span className="text-muted-foreground">
                  {order.delivery_address
                    ? `Room ${order.delivery_address.room_number}`
                    : "—"}
                </span>
                <Badge variant="outline" className="font-mono text-xs">
                  #{order.display_id}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Sub-Component: Delivery Checklist (grouped by hostel block) ---
function DeliveryChecklist({
  orders,
}: {
  batchId: string;
  orders?: BatchInfo["orders"];
}) {
  const [otpValues, setOtpValues] = useState<Record<string, string>>({});
  const [locallyVerified, setLocallyVerified] = useState<Set<string>>(
    new Set()
  );
  const verifyOtp = useVerifyOtp();

  const isOrderDone = (orderId: string, status: string) =>
    status === "COMPLETED" || locallyVerified.has(orderId);

  const pendingOrders = (orders || []).filter(
    (o) => !isOrderDone(o.id, o.status)
  );
  const completedCount = (orders || []).length - pendingOrders.length;
  const totalCount = orders?.length || 0;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleVerify = (orderId: string) => {
    const otp = otpValues[orderId];
    if (otp?.length !== 4) return;
    verifyOtp.mutate(
      { orderId, otp },
      {
        onSuccess: () => {
          setLocallyVerified((prev) => new Set(prev).add(orderId));
          setOtpValues((prev) => {
            const next = { ...prev };
            delete next[orderId];
            return next;
          });
        },
      }
    );
  };

  const groupedByBlock = pendingOrders.reduce<
    Record<string, NonNullable<BatchInfo["orders"]>>
  >((acc, order) => {
    const block = order.delivery_address?.hostel_block || "Other";
    if (!acc[block]) acc[block] = [];
    acc[block].push(order);
    return acc;
  }, {});
  const sortedBlocks = Object.keys(groupedByBlock).sort();

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

      <div className="space-y-5 mt-2">
        {sortedBlocks.map((block) => (
          <div key={block}>
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-indigo-100 dark:bg-indigo-900/40 px-3 py-1 rounded-full flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 tracking-wide uppercase">
                  Block {block}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {groupedByBlock[block].length} stop
                {groupedByBlock[block].length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="space-y-3 pl-1">
              {groupedByBlock[block].map((order) => {
                const address = order.delivery_address;
                const currentOtp = otpValues[order.id] || "";
                const isPendingVerify =
                  verifyOtp.isPending && currentOtp.length === 4;

                return (
                  <div
                    key={order.id}
                    className="p-4 rounded-xl border bg-background border-border shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-base leading-none mb-1">
                          {address
                            ? `Room ${address.room_number}`
                            : "No Location"}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {address?.building}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {order.phone && (
                          <a href={`tel:${order.phone}`}>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8 rounded-lg border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20"
                              title={`Call ${order.phone}`}
                            >
                              <Phone className="h-3.5 w-3.5" />
                            </Button>
                          </a>
                        )}
                        <Badge variant="outline" className="font-mono text-xs">
                          #{order.display_id}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex gap-2 items-center">
                      <InputOTP
                        maxLength={4}
                        value={currentOtp}
                        onChange={(val) =>
                          setOtpValues((prev) => ({
                            ...prev,
                            [order.id]: val,
                          }))
                        }
                      >
                        <InputOTPGroup className="w-full bg-background">
                          {[0, 1, 2, 3].map((i) => (
                            <InputOTPSlot
                              key={i}
                              index={i}
                              className="h-10 w-10 sm:h-12 sm:w-12 border-muted-foreground/30"
                            />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                      <Button
                        size="icon"
                        className={cn(
                          "h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-lg transition-colors",
                          currentOtp.length === 4
                            ? "bg-green-600 hover:bg-green-700 animate-pulse"
                            : "bg-muted text-muted-foreground hover:bg-muted"
                        )}
                        disabled={currentOtp.length < 4 || isPendingVerify}
                        onClick={() => handleVerify(order.id)}
                      >
                        <Check className="h-6 w-6" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

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
  const lockBatch = useLockBatch();
  const startDelivery = useStartDelivery();
  const completeBatch = useCompleteBatch();

  const cutoffDate = batch.cutoff_time ? new Date(batch.cutoff_time) : null;
  const formattedTime =
    cutoffDate && !isNaN(cutoffDate.getTime())
      ? cutoffDate.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const isOpen = batch.status === "OPEN";
  const isPrep = batch.status === "LOCKED";
  const isInTransit = batch.status === "IN_TRANSIT";

  const variants = {
    OPEN: {
      color: "border-l-4 border-l-emerald-500",
      badge:
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
      icon: LockOpen,
      title: "Accepting Orders",
    },
    LOCKED: {
      color: "border-l-4 border-l-amber-500",
      badge:
        "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
      icon: Package,
      title: "Preparation Phase",
    },
    IN_TRANSIT: {
      color: "border-l-4 border-l-blue-500",
      badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
      icon: Truck,
      title: "Delivery Phase",
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
            <h3 className="font-bold text-lg">{ui.title}</h3>
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
        {batch.item_summary && batch.item_summary.length > 0 && (
          <ShoppingListAccordion items={batch.item_summary} />
        )}

        {isOpen && batch.orders && batch.orders.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Incoming Orders
            </p>
            <OpenOrderList orders={batch.orders} />
          </div>
        )}

        {isOpen && (!batch.orders || batch.orders.length === 0) && (
          <div className="text-center py-6 text-sm text-muted-foreground border rounded-lg bg-muted/20">
            No orders yet — waiting for customers.
          </div>
        )}

        {isInTransit && (
          <DeliveryChecklist batchId={batch.id} orders={batch.orders} />
        )}
      </CardContent>

      <CardFooter className="p-4 bg-muted/20 border-t flex flex-col gap-2">
        {isOpen && (
          <>
            <Button
              className="w-full text-base h-12 shadow-md bg-amber-600 hover:bg-amber-700"
              onClick={() => lockBatch.mutate(batch.id)}
              disabled={lockBatch.isPending || batch.order_count === 0}
            >
              <Lock className="mr-2 h-4 w-4" />
              {batch.order_count === 0
                ? "No orders to lock"
                : "Lock Batch & Start Prep"}
            </Button>
            {batch.order_count > 0 && (
              <div className="flex gap-2 w-full">
                <CancelBatchDialog
                  batchId={batch.id}
                  orderCount={batch.order_count}
                />
              </div>
            )}
          </>
        )}

        {isPrep && (
          <>
            <Button
              className="w-full text-base h-12 shadow-md bg-blue-600 hover:bg-blue-700"
              onClick={() => startDelivery.mutate(batch.id)}
              disabled={startDelivery.isPending}
            >
              <Navigation className="mr-2 h-4 w-4" /> Start Delivery Route
            </Button>
            <div className="flex gap-2 w-full">
              <UnlockBatchDialog batchId={batch.id} />
              <CancelBatchDialog
                batchId={batch.id}
                orderCount={batch.order_count}
              />
            </div>
          </>
        )}

        {isInTransit && (
          <>
            <Button
              className="w-full text-base h-12 shadow-md bg-green-600 hover:bg-green-700"
              onClick={() => completeBatch.mutate(batch.id)}
              disabled={completeBatch.isPending}
            >
              <Check className="mr-2 h-4 w-4" /> Finish & Collect Earnings
            </Button>
            <div className="flex gap-2 w-full">
              <CancelBatchDialog
                batchId={batch.id}
                orderCount={batch.order_count}
              />
            </div>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
