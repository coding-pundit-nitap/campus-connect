"use client";

import { Clock, Package, Timer } from "lucide-react";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/cn";

interface BatchSlot {
  time: Date;
  label: string;
  isNextBatch: boolean;
}

interface BatchSlotSelectorProps {
  batchSlots: {
    id: string;
    cutoff_time_minutes: number;
    label: string | null;
    is_today_available?: boolean;
  }[];
  selectedSlot: Date | null;
  isDirectDelivery?: boolean;
  directDeliveryFee?: number;
  onSlotSelect: (slot: Date | null) => void;
}

function buildUpcomingSlots(
  configured: {
    cutoff_time_minutes: number;
    label: string | null;
    is_today_available?: boolean;
  }[]
): BatchSlot[] {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });

  const parts = formatter.formatToParts(now);
  const getVal = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value);

  const year = getVal("year");
  const month = getVal("month");
  const day = getVal("day");

  const todayUtcMs = Date.UTC(year, month - 1, day, 0, 0, 0);

  const occurrences: BatchSlot[] = [];

  for (let d = 0; d < 2; d++) {
    const dayStartUtcMs = todayUtcMs + d * 86400000;

    const dayDate = new Date(dayStartUtcMs);
    const dayYear = dayDate.getUTCFullYear();
    const dayMonth = dayDate.getUTCMonth();
    const dayDay = dayDate.getUTCDate();

    for (const slot of configured) {
      const hour = Math.floor(slot.cutoff_time_minutes / 60);
      const minute = slot.cutoff_time_minutes % 60;

      const timeMs =
        Date.UTC(dayYear, dayMonth, dayDay, hour, minute, 0) -
        5.5 * 60 * 60 * 1000;
      const time = new Date(timeMs);

      if (time.getTime() <= now.getTime()) continue;

      const isToday = d === 0;
      if (isToday && slot.is_today_available === false) {
        continue;
      }

      occurrences.push({
        time,
        label:
          slot.label ||
          time.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: "Asia/Kolkata",
          }),
        isNextBatch: false,
      });
    }
  }

  occurrences.sort((a, b) => a.time.getTime() - b.time.getTime());
  if (occurrences[0]) {
    occurrences[0].isNextBatch = true;
  }

  return occurrences;
}

export function BatchSlotSelector({
  batchSlots,
  selectedSlot,
  isDirectDelivery = false,
  directDeliveryFee = 0,
  onSlotSelect,
}: BatchSlotSelectorProps) {
  const slots = useMemo(() => buildUpcomingSlots(batchSlots), [batchSlots]);

  const formatSlotDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const slotsByDate = slots.reduce(
    (acc, slot) => {
      const dateKey = slot.time.toDateString();
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(slot);
      return acc;
    },
    {} as Record<string, BatchSlot[]>
  );

  return (
    <Card className="border-0 bg-transparent shadow-none px-0 py-0">
      <CardHeader className="px-0 pt-0 pb-4">
        <CardTitle className="flex items-center gap-2.5 text-lg font-bold text-foreground">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-600/10 text-blue-600">
            <Timer className="h-4 w-4" />
          </div>
          Select Delivery Mode
        </CardTitle>
        <CardDescription className="text-xs font-medium text-muted-foreground">
          Choose between dynamic batch delivery (free/discounted) or direct
          shipping.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 px-0 pb-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onClick={() => onSlotSelect(null)}
            className={cn(
              "flex flex-col p-4 rounded-2xl border cursor-pointer transition-all duration-300 relative overflow-hidden bg-card/40 backdrop-blur-md hover:translate-y-[-2px]",
              isDirectDelivery
                ? "ring-2 ring-orange-500/50 bg-orange-500/[0.03] border-orange-500 shadow-lg shadow-orange-500/[0.04]"
                : "border-border/40 hover:border-border/80 shadow-sm"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-linear-to-tr from-amber-500 to-orange-500 text-white shadow shadow-orange-500/10">
                <Package className="h-4.5 w-4.5" />
              </div>
              {isDirectDelivery && (
                <div className="h-4.5 w-4.5 rounded-full bg-orange-500 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-white" />
                </div>
              )}
            </div>
            <h4 className="font-bold text-sm text-foreground tracking-tight">
              Direct Delivery
            </h4>
            <p className="text-[11px] text-muted-foreground font-medium mt-1 leading-relaxed">
              Order ships immediately upon preparation. Perfect for fast craving
              satisfaction.
            </p>
            <div className="mt-4 pt-3 border-t border-border/20 flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70">
                Fee
              </span>
              <span className="text-xs font-extrabold text-foreground bg-muted/30 px-2 py-0.5 rounded-md border border-border/30">
                {directDeliveryFee > 0
                  ? `+₹${directDeliveryFee.toFixed(2)}`
                  : "Free"}
              </span>
            </div>
          </div>

          <div
            onClick={() => {
              if (slots.length > 0) {
                onSlotSelect(slots[0].time);
              }
            }}
            className={cn(
              "flex flex-col p-4 rounded-2xl border cursor-pointer transition-all duration-300 relative overflow-hidden bg-card/40 backdrop-blur-md hover:translate-y-[-2px]",
              !isDirectDelivery && selectedSlot
                ? "ring-2 ring-blue-600/50 bg-blue-600/[0.03] border-blue-600 shadow-lg shadow-blue-500/[0.04]"
                : "border-border/40 hover:border-border/80 shadow-sm",
              slots.length === 0 && "opacity-50 pointer-events-none"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-500 text-white shadow shadow-blue-500/10">
                <Clock className="h-4.5 w-4.5" />
              </div>
              {!isDirectDelivery && selectedSlot && (
                <div className="h-4.5 w-4.5 rounded-full bg-blue-600 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-white" />
                </div>
              )}
            </div>
            <h4 className="font-bold text-sm text-foreground tracking-tight">
              Batch Delivery
            </h4>
            <p className="text-[11px] text-muted-foreground font-medium mt-1 leading-relaxed">
              Consolidated courier batch cards. Environmentally friendly and
              cost efficient.
            </p>
            <div className="mt-4 pt-3 border-t border-border/20 flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70">
                Fee
              </span>
              <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                Free
              </span>
            </div>
          </div>
        </div>

        {!isDirectDelivery && slots.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-border/20 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Select Slot Batch
              </span>
              <Badge
                variant="outline"
                className="text-[10px] font-bold bg-muted/20 border-border/40 text-muted-foreground"
              >
                {slots.length} Slots Available
              </Badge>
            </div>

            {Object.entries(slotsByDate).map(([dateKey, dateSlots]) => (
              <div key={dateKey} className="space-y-2">
                <p className="text-xs font-bold text-foreground tracking-tight">
                  {formatSlotDate(new Date(dateKey))}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {dateSlots.map((slot) => {
                    const isSelected =
                      selectedSlot?.getTime() === slot.time.getTime();
                    return (
                      <Button
                        type="button"
                        key={slot.time.toISOString()}
                        variant="outline"
                        className={cn(
                          "h-11 relative rounded-xl border border-border/50 bg-card/20 backdrop-blur-sm transition-all duration-300 font-semibold hover:border-blue-600/40 hover:bg-muted/10 flex items-center justify-center gap-1.5 px-3 text-xs",
                          isSelected &&
                            "ring-2 ring-blue-600/50 bg-blue-600/[0.04] border-blue-600 text-blue-600 shadow-md shadow-blue-500/[0.05]"
                        )}
                        onClick={() => onSlotSelect(slot.time)}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        {slot.label}
                        {slot.isNextBatch && (
                          <span className="absolute -top-1.5 -right-1 flex h-3 w-6">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full text-[8px] font-extrabold uppercase tracking-wide px-1 bg-emerald-500 text-white items-center justify-center leading-none">
                              Next
                            </span>
                          </span>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedSlot && !isDirectDelivery && (
          <div className="p-3 bg-muted/20 border border-border/20 rounded-xl flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground leading-tight">
                Batch Scheduled
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                {selectedSlot.toLocaleString("en-IN", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </p>
            </div>
          </div>
        )}

        {isDirectDelivery && (
          <div className="p-3 bg-amber-500/[0.04] border border-amber-500/20 rounded-xl flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground leading-tight">
                Direct Shipment Delivery
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                Dispatched directly via active couriers immediately as prepared.
                {directDeliveryFee > 0 &&
                  ` Extra direct surcharge of ₹${directDeliveryFee.toFixed(2)} applies.`}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
