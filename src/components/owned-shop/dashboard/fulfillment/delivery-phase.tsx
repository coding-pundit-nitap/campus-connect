"use client";

import { Check, MapPin, Phone, Truck } from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/cn";
import { BatchInfo, DirectOrderInfo } from "@/services/batch";

type BatchOrder = NonNullable<BatchInfo["orders"]>[number];

interface DeliveryPhaseProps {
  isBatch: boolean;
  currentDirectOrder: DirectOrderInfo | null | undefined;
  ordersList: BatchOrder[];
  groupedByBlock: Record<string, BatchOrder[]>;
  sortedBlocks: string[];
  currentBlock: string;
  currentBlockOrders: BatchOrder[];
  currentBlockIdx: number;
  setCurrentBlockIdx: (idx: number) => void;
  completedCount: number;
  totalCount: number;
  deliveryProgress: number;
  isOrderDone: (orderId: string, status: string) => boolean;
  onOpenOtpKeypad: (orderId: string) => void;
  onCompleteDelivery: () => void;
  isCompletePending: boolean;
  cancelBtn: React.ReactNode;
  onBack: () => void;
}

export function DeliveryPhase({
  isBatch,
  currentDirectOrder,
  ordersList,
  groupedByBlock,
  sortedBlocks,
  currentBlock,
  currentBlockOrders,
  currentBlockIdx,
  setCurrentBlockIdx,
  completedCount,
  totalCount,
  deliveryProgress,
  isOrderDone,
  onOpenOtpKeypad,
  onCompleteDelivery,
  isCompletePending,
  cancelBtn,
  onBack,
}: DeliveryPhaseProps) {
  const isDirectDone =
    !isBatch && currentDirectOrder
      ? isOrderDone(currentDirectOrder.id, currentDirectOrder.status)
      : false;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 select-none">
      {isBatch ? (
        <>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-bold text-muted-foreground px-1">
              <span className="uppercase tracking-widest flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-primary" />
                Delivered
              </span>
              <span className="font-mono text-sm font-extrabold">
                {completedCount}/{totalCount} done
              </span>
            </div>
            <Progress
              value={deliveryProgress}
              className="h-2.5 rounded-full bg-muted"
            />
          </div>

          {sortedBlocks.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 select-none">
              {sortedBlocks.map((block, idx) => {
                const isActive = idx === currentBlockIdx;
                const blockOrders = groupedByBlock[block] || [];
                const verifiedInBlock = blockOrders.filter((o) =>
                  isOrderDone(o.id, o.status)
                ).length;
                const isBlockDone = verifiedInBlock === blockOrders.length;

                return (
                  <Button
                    key={block}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "rounded-full gap-1.5 text-xs font-bold shrink-0 shadow-sm border h-8",
                      isBlockDone &&
                        !isActive &&
                        "border-emerald-500/30 text-emerald-600 bg-emerald-500/5 hover:bg-emerald-500/10"
                    )}
                    onClick={() => setCurrentBlockIdx(idx)}
                  >
                    {block}
                    <Badge
                      variant={isActive ? "secondary" : "outline"}
                      className="text-[9px] py-0 px-1 h-fit"
                    >
                      {verifiedInBlock}/{blockOrders.length}
                    </Badge>
                  </Button>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="bg-indigo-500/5 dark:bg-indigo-500/10 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 border border-indigo-500/10">
              <MapPin className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">
                {currentBlock}
              </span>
            </div>
            <span className="text-xs font-bold text-muted-foreground">
              {currentBlockOrders.length} room
              {currentBlockOrders.length !== 1 ? "s" : ""} here
            </span>
          </div>

          <div className="grid gap-3">
            {currentBlockOrders.map((order) => {
              const isDone = isOrderDone(order.id, order.status);
              return (
                <div
                  key={order.id}
                  className={cn(
                    "p-4 border rounded-2xl shadow-sm transition-all flex justify-between items-center gap-4 bg-background",
                    isDone && "bg-muted/20 border-dashed opacity-60"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <h4
                      className={cn(
                        "font-extrabold text-xl sm:text-2xl leading-none mb-1.5 text-foreground tracking-tight",
                        isDone && "line-through text-muted-foreground"
                      )}
                    >
                      Room {order.delivery_address?.room_number || "—"}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate leading-relaxed">
                      {order.delivery_address?.building}
                    </p>
                    {isDone ? (
                      <div className="flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 gap-1 mt-2">
                        <Check className="h-4.5 w-4.5" /> Done ✓
                      </div>
                    ) : (
                      <div className="text-[10px] font-mono text-muted-foreground/75 mt-1.5">
                        #{order.display_id}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isDone && order.phone && (
                      <a href={`tel:${order.phone}`}>
                        <Button
                          variant="outline"
                          className="h-12 px-4 rounded-xl border-green-200 text-green-700 hover:bg-green-500/10 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 text-xs font-bold"
                          title={`Call ${order.phone}`}
                        >
                          <Phone className="h-4 w-4" />
                          Call
                        </Button>
                      </a>
                    )}
                    {!isDone ? (
                      <Button
                        className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl h-12 px-5 text-sm shadow-sm active:scale-95 transition-all"
                        onClick={() => onOpenOtpKeypad(order.id)}
                      >
                        Enter OTP
                      </Button>
                    ) : (
                      <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/20">
                        <Check className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <Card className="rounded-2xl border bg-card shadow-sm p-6 space-y-4">
          <Truck className="h-12 w-12 text-blue-500 mx-auto opacity-80" />
          <div className="text-center space-y-1.5">
            <h3 className="font-bold text-lg">Deliver to Room</h3>
            <p className="text-sm text-muted-foreground">
              Go to Room{" "}
              <strong className="text-foreground">
                {currentDirectOrder?.delivery_address?.room_number}
              </strong>{" "}
              and ask for their 4-digit code.
            </p>
          </div>
          {isDirectDone ? (
            <div className="flex items-center justify-center text-sm font-bold text-green-600 gap-1.5 py-2">
              <Check className="h-5 w-5" /> Delivered ✓
            </div>
          ) : (
            <div className="flex flex-col gap-3 pt-2">
              {currentDirectOrder?.phone && (
                <a href={`tel:${currentDirectOrder.phone}`} className="w-full">
                  <Button
                    variant="outline"
                    className="w-full h-11 border-green-300 text-green-700 hover:bg-green-500/10 rounded-xl gap-2 font-bold shadow-sm"
                  >
                    <Phone className="h-4 w-4" /> Call
                  </Button>
                </a>
              )}
              <Button
                className="w-full h-11 bg-primary hover:bg-primary/95 text-primary-foreground rounded-xl font-bold shadow-sm"
                onClick={() => onOpenOtpKeypad(currentDirectOrder!.id)}
              >
                Enter OTP
              </Button>
            </div>
          )}
        </Card>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur border-t p-4 shadow-lg flex flex-col gap-2 max-w-xl mx-auto w-full rounded-t-2xl">
        {isBatch ? (
          <Button
            className="w-full text-base h-12 shadow-md bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all active:scale-[0.99]"
            onClick={onCompleteDelivery}
            disabled={isCompletePending}
          >
            <Check className="mr-2 h-4 w-4" /> All Done ✓
          </Button>
        ) : (
          isDirectDone && (
            <Button
              className="w-full text-base h-12 shadow-md bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all active:scale-[0.99]"
              onClick={onBack}
            >
              <Check className="mr-2 h-4 w-4" /> Done ✓
            </Button>
          )
        )}
        <div className="flex gap-2 w-full mt-1">{cancelBtn}</div>
      </div>
    </div>
  );
}
