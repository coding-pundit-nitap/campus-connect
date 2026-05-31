"use client";

import { Navigation, Package, ShoppingBag } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/cn";
import { BatchSummaryItem, DirectOrderInfo } from "@/services/batch";

interface PrepPhaseProps {
  isBatch: boolean;
  items: BatchSummaryItem[];
  currentDirectOrder: DirectOrderInfo | null | undefined;
  checkedItems: Record<string, boolean>;
  onToggleItem: (productId: string) => void;
  checkedItemsCount: number;
  totalItemsCount: number;
  prepProgress: number;
  allItemsPacked: boolean;
  onStartDelivery: () => void;
  isDeliveryPending: boolean;
  cancelBtn: React.ReactNode;
  unlockBtn?: React.ReactNode;
}

export function PrepPhase({
  isBatch,
  items,
  currentDirectOrder,
  checkedItems,
  onToggleItem,
  checkedItemsCount,
  totalItemsCount,
  prepProgress,
  allItemsPacked,
  onStartDelivery,
  isDeliveryPending,
  cancelBtn,
  unlockBtn,
}: PrepPhaseProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-5 flex gap-4">
        <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl h-fit">
          <Package className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-base leading-tight text-amber-950 dark:text-amber-200">
            Pack the Order
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Tap each item as you pack it into the bag.
          </p>
        </div>
      </div>

      {isBatch ? (
        <Card className="rounded-2xl border bg-card shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b flex flex-col gap-2 bg-muted/20">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 select-none">
                <ShoppingBag className="h-4 w-4 text-orange-500" />
                Packed
              </span>
              <span className="font-mono text-xs font-bold">
                {checkedItemsCount}/{totalItemsCount} packed
              </span>
            </div>
            <Progress value={prepProgress} className="h-2 rounded-full" />
          </div>
          <CardContent className="p-4 gap-2 flex flex-col">
            {items.map((item) => {
              const isChecked = checkedItems[item.product_id] || false;
              return (
                <div
                  key={item.product_id}
                  className={cn(
                    "flex justify-between items-center p-3.5 border rounded-xl transition-all cursor-pointer select-none",
                    isChecked
                      ? "bg-emerald-500/5 border-emerald-500/30 opacity-70"
                      : "bg-background border-border/80 hover:bg-muted/20"
                  )}
                  onClick={() => onToggleItem(item.product_id)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isChecked}
                      className="h-5 w-5 rounded-md border-muted-foreground/35 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleItem(item.product_id);
                      }}
                    />
                    <span
                      className={cn(
                        "font-semibold text-sm",
                        isChecked && "line-through text-muted-foreground"
                      )}
                    >
                      {item.name}
                    </span>
                  </div>
                  <span className="font-extrabold text-xs bg-muted border px-2.5 py-1 rounded-lg">
                    x{item.quantity}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl border bg-card shadow-sm p-6 text-center space-y-4">
          <Package className="h-12 w-12 text-amber-500 mx-auto opacity-80" />
          <div>
            <h3 className="font-bold text-lg">Get Ready</h3>
            <p className="text-sm text-muted-foreground mt-1.5">
              Pack the items for Room{" "}
              <strong className="text-foreground">
                {currentDirectOrder?.delivery_address?.room_number}
              </strong>
              , then tap the button below.
            </p>
          </div>
        </Card>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur border-t p-4 shadow-lg flex flex-col gap-2 max-w-xl mx-auto w-full rounded-t-2xl">
        {isBatch ? (
          <Button
            className={cn(
              "w-full text-base h-12 shadow-md rounded-xl font-bold transition-all active:scale-[0.99]",
              allItemsPacked
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed"
            )}
            onClick={() => {
              if (allItemsPacked) onStartDelivery();
            }}
            disabled={isDeliveryPending || !allItemsPacked}
          >
            <Navigation className="mr-2 h-4 w-4" /> I'm Ready, Start Delivering
          </Button>
        ) : (
          <Button
            className="w-full text-base h-12 shadow-md bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold transition-all active:scale-[0.99]"
            onClick={onStartDelivery}
            disabled={isDeliveryPending}
          >
            <Navigation className="mr-2 h-4 w-4" /> I'm Ready, Start Delivering
          </Button>
        )}
        <div className="flex gap-2 w-full mt-1">
          {isBatch && unlockBtn}
          {cancelBtn}
        </div>
      </div>
    </div>
  );
}
