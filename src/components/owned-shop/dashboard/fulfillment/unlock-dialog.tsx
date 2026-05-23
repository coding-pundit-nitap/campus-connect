"use client";

import { LockOpen } from "lucide-react";
import React, { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useUnlockBatch } from "@/hooks/queries/useBatch";

interface UnlockConsoleDialogProps {
  batchId: string;
}

export function UnlockConsoleDialog({ batchId }: UnlockConsoleDialogProps) {
  const [open, setOpen] = useState(false);
  const unlockBatch = useUnlockBatch();

  const handleUnlock = () => {
    unlockBatch.mutate(batchId, {
      onSuccess: () => {
        setOpen(false);
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full border-amber-400 text-amber-600 hover:bg-amber-50 hover:text-amber-700 h-11 text-sm font-semibold rounded-xl select-none"
        >
          Reopen for more orders
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl p-6 shadow-2xl border bg-background/95 backdrop-blur-xl">
        <AlertDialogHeader className="pb-2 border-b border-border/50">
          <AlertDialogTitle className="flex items-center gap-2 text-amber-600 font-bold text-lg">
            <LockOpen className="h-5 w-5 shrink-0" />
            Reopen this batch?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs mt-1 leading-relaxed">
            New orders can be added again. OTP codes will change when you
            re-lock.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:justify-end border-t border-border/50 pt-4">
          <AlertDialogCancel asChild>
            <Button
              variant="outline"
              disabled={unlockBatch.isPending}
              className="rounded-xl font-bold"
            >
              Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold"
              onClick={handleUnlock}
              disabled={unlockBatch.isPending}
            >
              {unlockBatch.isPending ? "Reopening..." : "Yes, Reopen"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
