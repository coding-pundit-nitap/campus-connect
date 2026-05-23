"use client";

import React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/cn";

interface TouchKeypadProps {
  value: string;
  onChange: (val: string) => void;
  onClose: () => void;
  onSubmit: (otpVal: string) => void;
  isPending: boolean;
  orderRoom: string;
}

export function TouchKeypad({
  value,
  onChange,
  onClose,
  onSubmit,
  isPending,
  orderRoom,
}: TouchKeypadProps) {
  const handleNumPress = (num: string) => {
    if (value.length < 4) {
      const next = value + num;
      onChange(next);
      if (next.length === 4) {
        setTimeout(() => {
          onSubmit(next);
        }, 150);
      }
    }
  };

  const handleBackspace = () => {
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    onChange("");
  };

  return (
    <Dialog open={true} onOpenChange={() => !isPending && onClose()}>
      <DialogContent className="sm:max-w-xs p-6 gap-6 rounded-2xl overflow-hidden shadow-2xl border bg-background/95 backdrop-blur-xl">
        <DialogHeader className="text-center pb-2 border-b border-border/50">
          <DialogTitle className="text-lg font-bold text-foreground animate-in fade-in slide-in-from-top-1">
            Enter Code
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Ask customer in{" "}
            <strong className="text-foreground">{orderRoom}</strong> for their
            4-digit code
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center gap-6 py-2 select-none">
          <div className="flex gap-3 justify-center items-center h-14">
            {[0, 1, 2, 3].map((idx) => {
              const char = value[idx];
              const isActive = value.length === idx;
              return (
                <div
                  key={idx}
                  className={cn(
                    "w-12 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold font-mono transition-all shadow-sm bg-muted/20",
                    isActive
                      ? "border-primary bg-background ring-2 ring-primary/20 scale-105"
                      : char
                        ? "border-emerald-500/50 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                        : "border-muted-foreground/20 text-muted-foreground/30"
                  )}
                >
                  {char || "•"}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <Button
                key={num}
                variant="outline"
                className="h-12 text-lg font-bold rounded-xl border bg-background hover:bg-muted/50 active:scale-95 transition-all shadow-sm"
                onClick={() => handleNumPress(num)}
                disabled={isPending}
              >
                {num}
              </Button>
            ))}
            <Button
              variant="ghost"
              className="h-12 text-sm font-semibold rounded-xl text-destructive hover:bg-destructive/10 active:scale-95 transition-all"
              onClick={handleClear}
              disabled={isPending}
            >
              Clear
            </Button>
            <Button
              variant="outline"
              className="h-12 text-lg font-bold rounded-xl border bg-background hover:bg-muted/50 active:scale-95 transition-all shadow-sm"
              onClick={() => handleNumPress("0")}
              disabled={isPending}
            >
              0
            </Button>
            <Button
              variant="ghost"
              className="h-12 text-sm font-semibold rounded-xl hover:bg-muted active:scale-95 transition-all"
              onClick={handleBackspace}
              disabled={isPending}
            >
              ⌫
            </Button>
          </div>
        </div>

        {isPending && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="text-sm font-semibold text-muted-foreground animate-pulse">
              Checking...
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
