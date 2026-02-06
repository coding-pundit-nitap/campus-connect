"use client";

import { AlertTriangle, Check, Clock, Package, Truck, X } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  useCancelBatch,
  useCompleteBatch,
  useStartDelivery,
  useVerifyOtp,
} from "@/hooks/queries/useBatch";
import { BatchInfo, BatchSummaryItem } from "@/services/batch";

interface ActiveBatchCardProps {
  batch: BatchInfo;
}

function ItemSummaryList({ items }: { items: BatchSummaryItem[] }) {
  return (
    <div className="space-y-2 rounded-lg bg-muted/50 p-3">
      <h4 className="text-sm font-semibold text-muted-foreground">
        Shopping List
      </h4>
      <ul className="grid gap-1.5">
        {items.map((item) => (
          <li
            key={item.product_id}
            className="flex items-center justify-between rounded-md bg-background px-3 py-2"
          >
            <span className="font-medium">{item.name}</span>
            <Badge variant="secondary" className="font-mono">
              ×{item.quantity}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OtpVerificationSection({
  batchId: _batchId,
  orders,
}: {
  batchId: string;
  orders?: { id: string; display_id: string }[];
}) {
  const [otpValues, setOtpValues] = useState<Record<string, string>>({});
  const verifyOtp = useVerifyOtp();

  if (!orders || orders.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-2">
        No orders to verify
      </p>
    );
  }

  const handleVerify = (orderId: string) => {
    const otp = otpValues[orderId];
    if (otp && otp.length === 4) {
      verifyOtp.mutate({ orderId, otp });
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-muted-foreground">
        Verify Orders (Enter OTP from customer)
      </h4>
      <div className="space-y-2">
        {orders.map((order) => (
          <div
            key={order.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-background border"
          >
            <Badge variant="outline" className="font-mono shrink-0">
              {order.display_id}
            </Badge>
            <InputOTP
              maxLength={4}
              value={otpValues[order.id] || ""}
              onChange={(value) =>
                setOtpValues((prev) => ({ ...prev, [order.id]: value }))
              }
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </InputOTP>
            <Button
              size="sm"
              onClick={() => handleVerify(order.id)}
              disabled={
                verifyOtp.isPending || (otpValues[order.id]?.length || 0) < 4
              }
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

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
    cancelBatch.mutate(
      { batchId, reason: reason || "Weather/Emergency" },
      { onSuccess: () => setOpen(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" className="gap-1">
          <AlertTriangle className="h-4 w-4" />
          Cancel Batch
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Cancel Entire Batch?
          </DialogTitle>
          <DialogDescription>
            This will cancel all {orderCount} orders in this batch. Students
            will be notified and refunded.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="Reason (optional): Weather, emergency, etc."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            <X className="mr-2 h-4 w-4" />
            Keep Batch
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={cancelBatch.isPending}
          >
            {cancelBatch.isPending ? "Cancelling..." : "Yes, Cancel All"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ActiveBatchCard({ batch }: ActiveBatchCardProps) {
  const startDelivery = useStartDelivery();
  const completeBatch = useCompleteBatch();

  const cutoffTime = new Date(batch.cutoff_time);
  const formattedTime = cutoffTime.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isLocked = batch.status === "LOCKED";
  const isInTransit = batch.status === "IN_TRANSIT";

  const statusConfig = {
    LOCKED: {
      label: "PREP MODE",
      color: "bg-amber-500",
      icon: Package,
      actionLabel: "Start Delivery (Go Up Hill)",
      actionVariant: "default" as const,
      onAction: () => startDelivery.mutate(batch.id),
      isPending: startDelivery.isPending,
    },
    IN_TRANSIT: {
      label: "IN TRANSIT",
      color: "bg-blue-500",
      icon: Truck,
      actionLabel: "Complete Batch",
      actionVariant: "default" as const,
      onAction: () => completeBatch.mutate(batch.id),
      isPending: completeBatch.isPending,
    },
  };

  const config = statusConfig[batch.status as keyof typeof statusConfig];
  if (!config) return null;

  const StatusIcon = config.icon;

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`rounded-full p-2 ${config.color}`}>
              <StatusIcon className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-lg">{config.label}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isLocked && (
              <CancelBatchDialog
                batchId={batch.id}
                orderCount={batch.order_count}
              />
            )}
            <Badge variant="outline" className="font-mono">
              <Clock className="mr-1 h-3 w-3" />
              {formattedTime}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-muted p-3 text-center">
            <div className="text-2xl font-bold">{batch.order_count}</div>
            <div className="text-xs text-muted-foreground">Orders</div>
          </div>
          <div className="rounded-lg bg-muted p-3 text-center">
            <div className="text-2xl font-bold text-green-600">
              ₹{batch.total_earnings.toFixed(0)}
            </div>
            <div className="text-xs text-muted-foreground">Earnings</div>
          </div>
        </div>

        {batch.item_summary && batch.item_summary.length > 0 && (
          <ItemSummaryList items={batch.item_summary} />
        )}

        {isInTransit && (
          <OtpVerificationSection batchId={batch.id} orders={batch.orders} />
        )}
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          size="lg"
          variant={config.actionVariant}
          disabled={config.isPending}
          onClick={config.onAction}
        >
          {config.isPending ? (
            "Processing..."
          ) : (
            <>
              {isLocked ? (
                <Truck className="mr-2 h-4 w-4" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              {config.actionLabel}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
