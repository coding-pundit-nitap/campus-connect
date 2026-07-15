"use client";

import { format } from "date-fns";
import { TimerReset, Truck, XSquare } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BatchMilestone } from "@/generated/client";

export function BatchControlBar({
  activeBatch,
  batchNewCount,
  batchAcceptedCount,
  remainingDispatch,
  pending,
  onAdjustCutoff,
  onCloseBatch,
  onStartRun,
  onCompleteRun,
  currentMilestone,
  onUpdateMilestone,
  onCancelRun,
}: {
  activeBatch: {
    id: string;
    cutoff_time: string;
    status: string;
    delivery_status?: { current_milestone: string } | null;
  } | null;
  batchNewCount: number;
  batchAcceptedCount: number;
  remainingDispatch: number;
  pending: boolean;
  onAdjustCutoff: (min: number) => void;
  onCloseBatch: () => void;
  onStartRun: () => void;
  onCompleteRun: () => void;
  currentMilestone?: string | null;
  onUpdateMilestone?: (milestone: BatchMilestone) => void;
  onCancelRun?: () => void;
}) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  if (!activeBatch) return null;

  return (
    <div className="sticky bottom-0 z-30 border-t border-border/40 bg-background/80 backdrop-blur-xl px-4 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] no-print">
      <div className="mx-auto flex max-w-5xl flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg shrink-0">
            <TimerReset className="h-4 w-4 animate-pulse" />
          </div>
          <div className="text-xs sm:text-sm">
            <span className="font-semibold text-muted-foreground">
              Batch Cutoff{" "}
            </span>
            <span className="font-extrabold text-foreground tabular-nums bg-muted/40 px-2 py-0.5 rounded-md ml-1 border border-border/10">
              {format(new Date(activeBatch.cutoff_time), "h:mm a")}
            </span>
            <span className="text-muted-foreground mx-2">·</span>
            <span className="text-xs text-muted-foreground/80 font-bold uppercase tracking-wider">
              {batchAcceptedCount} accepted • {batchNewCount} new
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 mt-3 sm:mt-0 w-full sm:w-auto">
          <div className="flex items-center gap-2 justify-between sm:justify-start">
            <div className="flex items-center border border-border/40 rounded-xl overflow-hidden bg-card/40 p-0.5 shadow-inner">
              <button
                type="button"
                onClick={() => onAdjustCutoff(-15)}
                disabled={pending}
                className="h-10 sm:h-9 px-3 text-xs font-bold hover:bg-muted/60 transition-colors disabled:opacity-50 text-foreground cursor-pointer"
                title="Subtract 15 minutes"
              >
                −15m
              </button>
              <div className="w-[1px] h-4 bg-border/40" />
              <button
                type="button"
                onClick={() => onAdjustCutoff(15)}
                disabled={pending}
                className="h-10 sm:h-9 px-3 text-xs font-bold hover:bg-muted/60 transition-colors disabled:opacity-50 text-foreground cursor-pointer"
                title="Add 15 minutes"
              >
                +15m
              </button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCloseBatch}
              disabled={pending}
              className="h-10 sm:h-9 px-4 rounded-xl border-border/60 hover:bg-muted/30 font-semibold text-xs cursor-pointer transition-all hover:scale-102 active:scale-98"
            >
              Close Batch
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onStartRun}
              disabled={activeBatch.status !== "LOCKED" || pending}
              className="h-10 sm:h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer transition-all hover:scale-102 active:scale-98 shadow shadow-blue-500/10 border-none"
            >
              <Truck className="mr-1 h-3.5 w-3.5" />
              Start Run
            </Button>
          </div>

          <div className="flex items-center gap-2 justify-between sm:justify-start">
            {activeBatch.status === "IN_TRANSIT" && onUpdateMilestone && (
              <>
                <div className="hidden sm:flex items-center gap-1 border border-border/40 rounded-xl p-0.5 bg-card/40 shadow-inner mr-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      currentMilestone === "CLIMB_STARTED"
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      onUpdateMilestone("CLIMB_STARTED" as BatchMilestone)
                    }
                    disabled={pending}
                    className={`h-9 px-2.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                      currentMilestone === "CLIMB_STARTED"
                        ? "bg-blue-600 hover:bg-blue-700 text-white border-none"
                        : "border-transparent hover:bg-muted/60 text-foreground"
                    }`}
                  >
                    Climb Started
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      currentMilestone === "MIDWAY_100M_HILL"
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      onUpdateMilestone("MIDWAY_100M_HILL" as BatchMilestone)
                    }
                    disabled={pending}
                    className={`h-9 px-2.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                      currentMilestone === "MIDWAY_100M_HILL"
                        ? "bg-blue-600 hover:bg-blue-700 text-white border-none"
                        : "border-transparent hover:bg-muted/60 text-foreground"
                    }`}
                  >
                    Midway Hill
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      currentMilestone === "ARRIVED" ? "default" : "outline"
                    }
                    onClick={() =>
                      onUpdateMilestone("ARRIVED" as BatchMilestone)
                    }
                    disabled={pending}
                    className={`h-9 px-2.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                      currentMilestone === "ARRIVED"
                        ? "bg-blue-600 hover:bg-blue-700 text-white border-none"
                        : "border-transparent hover:bg-muted/60 text-foreground"
                    }`}
                  >
                    Arrived
                  </Button>
                </div>
                <div className="sm:hidden">
                  <Select
                    value={currentMilestone || ""}
                    onValueChange={(val) =>
                      onUpdateMilestone(val as BatchMilestone)
                    }
                    disabled={pending}
                  >
                    <SelectTrigger className="h-10 w-32 rounded-xl text-xs font-bold">
                      <SelectValue placeholder="Milestone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLIMB_STARTED">
                        Climb Started
                      </SelectItem>
                      <SelectItem value="MIDWAY_100M_HILL">
                        Midway Hill
                      </SelectItem>
                      <SelectItem value="ARRIVED">Arrived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCompleteRun}
              disabled={
                activeBatch.status !== "IN_TRANSIT" ||
                remainingDispatch > 0 ||
                pending
              }
              className="h-10 sm:h-9 px-4 rounded-xl border-border/60 hover:bg-muted/30 font-semibold text-xs cursor-pointer transition-all hover:scale-102 active:scale-98 disabled:opacity-50"
            >
              Complete Run
            </Button>

            {onCancelRun && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (showCancelConfirm) {
                    onCancelRun();
                    setShowCancelConfirm(false);
                  } else {
                    setShowCancelConfirm(true);
                    setTimeout(() => setShowCancelConfirm(false), 3000);
                  }
                }}
                disabled={
                  pending ||
                  (activeBatch.status !== "LOCKED" &&
                    activeBatch.status !== "IN_TRANSIT")
                }
                className={`h-10 sm:h-9 px-4 rounded-xl font-semibold text-xs cursor-pointer transition-all hover:scale-102 active:scale-98 disabled:opacity-50 ${
                  showCancelConfirm
                    ? "bg-red-600 hover:bg-red-700 text-white border-none"
                    : "border-red-500/50 text-red-500 hover:bg-red-500/10"
                }`}
              >
                <XSquare className="mr-1 h-3.5 w-3.5" />
                {showCancelConfirm ? "Confirm Cancel" : "Cancel Run"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
