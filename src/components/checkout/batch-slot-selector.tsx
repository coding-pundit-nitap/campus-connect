"use client";

import { Clock, Timer } from "lucide-react";
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
  }[];
  selectedSlot: Date | null;
  onSlotSelect: (slot: Date) => void;
}

function buildUpcomingSlots(
  configured: { cutoff_time_minutes: number; label: string | null }[]
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
        {slots.length === 0 && (
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

        {selectedSlot && (
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
      </CardContent>
    </Card>
  );
}
