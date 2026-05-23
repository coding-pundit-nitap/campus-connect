"use client";

import { AlertTriangle,X } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCancelBatch } from "@/hooks/queries/useBatch";

interface CancelConsoleDialogProps {
  batchId: string;
  orderCount: number;
  onCloseConsole: () => void;
}

export function CancelConsoleDialog({
  batchId,
  orderCount,
  onCloseConsole,
}: CancelConsoleDialogProps) {
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
          toast.success("Batch successfully cancelled.");
          onCloseConsole();
        },
      }
    );
  };

  return (
    <>
      <Button
        variant="ghost"
        className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive h-11 text-sm font-semibold rounded-xl mt-2 select-none"
        onClick={() => setOpen(true)}
      >
        {orderCount > 1 ? "Cancel All Orders" : "Cancel Order"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6 shadow-2xl border bg-background/95 backdrop-blur-xl">
          <DialogHeader className="pb-2 border-b border-border/50">
            <DialogTitle className="flex items-center gap-2 text-destructive font-bold text-lg">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              {orderCount > 1 ? "Cancel all orders?" : "Cancel order?"}
            </DialogTitle>
            <DialogDescription className="text-xs mt-1 leading-relaxed">
              This will cancel{" "}
              <strong>
                {orderCount} {orderCount > 1 ? "orders" : "order"}
              </strong>
              . Customers will be refunded. You can't undo this.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">
              Why are you cancelling?{" "}
              <span className="text-destructive">*</span>
            </label>
            <Input
              className="w-full rounded-xl border focus:ring-destructive/30"
              placeholder="e.g., Item out of stock, unable to fulfill..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={cancelBatch.isPending}
            />
          </div>

          <DialogFooter className="gap-2 sm:justify-end border-t border-border/50 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={cancelBatch.isPending}
              className="rounded-xl font-bold"
            >
              Go Back
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={!reason.trim() || cancelBatch.isPending}
              className="rounded-xl font-bold"
            >
              {cancelBatch.isPending ? "Cancelling..." : "Yes, Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
