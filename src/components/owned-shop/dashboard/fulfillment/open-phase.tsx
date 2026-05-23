"use client";

import { Lock, LockOpen, ShoppingBag } from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface OpenPhaseProps {
  items: any[];
  ordersList: any[];
  onLockBatch: () => void;
  isLockPending: boolean;
  cancelBtn: React.ReactNode;
}

export function OpenPhase({
  items,
  ordersList,
  onLockBatch,
  isLockPending,
  cancelBtn,
}: OpenPhaseProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5 flex gap-4">
        <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl h-fit">
          <LockOpen className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-base leading-tight text-emerald-950 dark:text-emerald-200">
            Accepting Orders
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Orders are coming in. Tap the button below when you're ready to
            start packing.
          </p>
        </div>
      </div>

      {items.length > 0 ? (
        <Card className="rounded-2xl border bg-card shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b flex justify-between items-center bg-muted/20">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 select-none">
              <ShoppingBag className="h-4 w-4 text-orange-500" />
              Items to Pack
            </span>
            <Badge variant="secondary">{items.length} items</Badge>
          </div>
          <CardContent className="p-4 gap-2.5 flex flex-col">
            {items.map((item: any) => (
              <div
                key={item.product_id}
                className="flex justify-between items-center text-sm p-3 bg-muted/40 rounded-xl border border-border/30 hover:bg-muted/50 transition-colors"
              >
                <span className="font-semibold text-foreground">
                  {item.name}
                </span>
                <span className="font-bold text-xs bg-background border px-3 py-1 rounded-lg shadow-sm">
                  x{item.quantity}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-10 px-4 border border-dashed rounded-2xl bg-muted/15 flex flex-col items-center">
          <ShoppingBag className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <span className="font-bold text-muted-foreground">No orders yet</span>
          <span className="text-xs text-muted-foreground/75 mt-1">
            Waiting for orders...
          </span>
        </div>
      )}

      {ordersList.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">
            Orders in this Batch
          </h4>
          <div className="grid gap-2.5">
            {ordersList.map((order: any) => (
              <div
                key={order.id}
                className="flex justify-between items-center p-3 border rounded-xl bg-background/50 hover:bg-background/80 shadow-sm transition-colors text-sm"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-foreground">
                    Room {order.delivery_address?.room_number || "—"}
                  </span>
                  <span className="text-xs text-muted-foreground mt-0.5">
                    {order.delivery_address?.hostel_block} •{" "}
                    {order.delivery_address?.building}
                  </span>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  #{order.display_id}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur border-t p-4 shadow-lg flex flex-col gap-2 max-w-xl mx-auto w-full rounded-t-2xl">
        <Button
          className="w-full text-base h-12 shadow-md bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-all active:scale-[0.99]"
          onClick={onLockBatch}
          disabled={isLockPending || ordersList.length === 0}
        >
          <Lock className="mr-2 h-4 w-4" />
          {ordersList.length === 0 ? "No orders yet" : "Start Packing"}
        </Button>
        {ordersList.length > 0 && cancelBtn}
      </div>
    </div>
  );
}
