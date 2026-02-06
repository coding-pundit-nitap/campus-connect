"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type BatchCardInput = {
  cutoff_time_minutes: number;
  label?: string | null;
};

function minutesToTime(minutes: number): string {
  const hh = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const mm = (minutes % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map((v) => Number(v));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return Math.max(0, Math.min(1439, h * 60 + m));
}

export function BatchCardsEditor({
  value,
  onChange,
  disabled,
}: {
  value: BatchCardInput[];
  onChange: (next: BatchCardInput[]) => void;
  disabled?: boolean;
}) {
  const sorted = useMemo(() => {
    return [...value].sort(
      (a, b) => a.cutoff_time_minutes - b.cutoff_time_minutes
    );
  }, [value]);

  const addCard = () => {
    const base = sorted[sorted.length - 1]?.cutoff_time_minutes ?? 17 * 60;
    const nextMinutes = Math.min(1439, base + 60);
    onChange([...sorted, { cutoff_time_minutes: nextMinutes, label: null }]);
  };

  const updateAt = (index: number, patch: Partial<BatchCardInput>) => {
    const next = sorted.map((c, i) => (i === index ? { ...c, ...patch } : c));
    onChange(next);
  };

  const removeAt = (index: number) => {
    onChange(sorted.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Batch cards</p>
          <p className="text-sm text-muted-foreground">
            Add daily cutoff times (e.g. 12:30, 17:00). If none, shop runs
            direct delivery.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addCard}
          disabled={disabled}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add card
        </Button>
      </div>

      <div className="space-y-2">
        {sorted.length === 0 && (
          <div className="rounded-lg border p-3 text-sm text-muted-foreground">
            No batch cards yet. Customers will place orders for direct delivery.
          </div>
        )}

        {sorted.map((card, index) => (
          <div
            key={`${card.cutoff_time_minutes}-${index}`}
            className="grid grid-cols-1 gap-2 rounded-lg border p-3 sm:grid-cols-12 sm:items-end"
          >
            <div className="sm:col-span-3">
              <Label className="text-xs">Cutoff time</Label>
              <Input
                type="time"
                value={minutesToTime(card.cutoff_time_minutes)}
                disabled={disabled}
                onChange={(e) =>
                  updateAt(index, {
                    cutoff_time_minutes: timeToMinutes(e.currentTarget.value),
                  })
                }
              />
            </div>
            <div className="sm:col-span-8">
              <Label className="text-xs">Label (optional)</Label>
              <Input
                placeholder='e.g. "5 PM Batch"'
                value={card.label ?? ""}
                disabled={disabled}
                onChange={(e) =>
                  updateAt(index, { label: e.currentTarget.value })
                }
              />
            </div>
            <div className="sm:col-span-1 sm:flex sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={disabled}
                onClick={() => removeAt(index)}
                aria-label="Remove batch card"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
