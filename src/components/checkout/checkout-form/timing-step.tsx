import { ChevronRight, Clock } from "lucide-react";
import React from "react";

import { BatchSlotSelector } from "@/components/checkout/batch-slot-selector";
import { Button } from "@/components/ui/button";

interface TimingStepProps {
  batchSlots: {
    id: string;
    cutoff_time_minutes: number;
    label: string | null;
  }[];
  requestedDeliveryTime: Date | null;
  isDirectDelivery: boolean;
  direct_delivery_fee: number;
  onSelectSlot: (date: Date | null) => void;
  onConfirm: () => void;
}

export function TimingStep({
  batchSlots = [],
  requestedDeliveryTime,
  isDirectDelivery,
  direct_delivery_fee = 0,
  onSelectSlot,
  onConfirm,
}: TimingStepProps) {
  return (
    <div className="p-5 border-t border-border/10 space-y-4">
      {batchSlots.length > 0 ? (
        <BatchSlotSelector
          batchSlots={batchSlots}
          selectedSlot={requestedDeliveryTime}
          isDirectDelivery={isDirectDelivery}
          directDeliveryFee={direct_delivery_fee}
          onSlotSelect={onSelectSlot}
        />
      ) : (
        <div className="p-4 bg-muted/20 border border-border/20 rounded-xl text-center">
          <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2 animate-pulse" />
          <h4 className="font-bold text-sm">Direct Dispatch Delivery</h4>
          <p className="text-xs text-muted-foreground font-medium max-w-sm mx-auto mt-1">
            This shop operates with instant direct shipping and doesn't run
            scheduled batch cards.
          </p>
        </div>
      )}
      {(isDirectDelivery ||
        requestedDeliveryTime ||
        batchSlots.length === 0) && (
        <Button
          onClick={onConfirm}
          className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-500 hover:opacity-90 text-white font-bold rounded-xl shadow shadow-blue-500/10 mt-2 flex items-center justify-center gap-1 cursor-pointer"
        >
          Confirm Slot & Next <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
