"use client";

import { Clock, Package, Timer } from "lucide-react";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const occurrences: BatchSlot[] = [];

  const days = [today, tomorrow];
  for (const day of days) {
    for (const slot of configured) {
      const time = new Date(day);
      time.setHours(Math.floor(slot.cutoff_time_minutes / 60));
      time.setMinutes(slot.cutoff_time_minutes % 60);
      time.setSeconds(0);
      time.setMilliseconds(0);

      if (time.getTime() <= now.getTime()) continue;

      const isToday = day.getDate() === today.getDate();
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
    <Card className="px-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-5 w-5" />
          Select Delivery Batch
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Pick one of this shop’s batch cards.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Direct Delivery Option */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Delivery Options
          </p>
          <Button
            variant={isDirectDelivery ? "default" : "outline"}
            size="sm"
            className="w-full justify-start"
            onClick={() => onSlotSelect(null)}
          >
            <Package className="h-3 w-3 mr-2" />
            Direct Delivery
            {directDeliveryFee > 0 && (
              <span className="ml-auto text-xs">
                +₹{directDeliveryFee.toFixed(2)}
              </span>
            )}
          </Button>
        </div>

        {/* Separator */}
        {slots.length > 0 && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or select a batch slot
              </span>
            </div>
          </div>
        )}

        {slots.length === 0 && !isDirectDelivery && (
          <p className="text-sm text-muted-foreground">
            No upcoming batch slots available.
          </p>
        )}
        {Object.entries(slotsByDate).map(([dateKey, dateSlots]) => (
          <div key={dateKey} className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {formatSlotDate(new Date(dateKey))}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {dateSlots.map((slot) => {
                const isSelected =
                  selectedSlot?.getTime() === slot.time.getTime();
                return (
                  <Button
                    key={slot.time.toISOString()}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "relative",
                      slot.isNextBatch && !isSelected && "border-primary"
                    )}
                    onClick={() => onSlotSelect(slot.time)}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {slot.label}
                    {slot.isNextBatch && (
                      <Badge
                        variant="secondary"
                        className="absolute -top-2 -right-2 text-[10px] px-1 py-0"
                      >
                        Next
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        ))}

        {selectedSlot && !isDirectDelivery && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <span className="font-medium">Selected batch:</span>{" "}
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
        )}

        {isDirectDelivery && (
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm">
              <span className="font-medium">Direct Delivery selected</span>
              {directDeliveryFee > 0 && (
                <span className="text-muted-foreground">
                  {" "}
                  (+₹{directDeliveryFee.toFixed(2)} extra)
                </span>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
