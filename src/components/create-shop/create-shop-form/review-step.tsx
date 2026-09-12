import { Pencil } from "lucide-react";
import React from "react";
import { UseFormReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatTime } from "@/lib/shop-utils";
import { ShopActionFormData } from "@/validations/shop";

import { stepHeadingClass, stepSubheadingClass } from "./styles";

interface ReviewStepProps {
  form: UseFormReturn<ShopActionFormData>;
  goToStep: (step: number) => void;
}

function minutesToLabel(minutes: number): string {
  const hh = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const mm = (minutes % 60).toString().padStart(2, "0");
  return formatTime(`${hh}:${mm}`);
}

function ReviewGroup({
  title,
  step,
  goToStep,
  children,
}: {
  title: string;
  step: number;
  goToStep: (step: number) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="py-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => goToStep(step)}
          className="h-8 gap-1.5 px-2.5 text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
      </div>
      <div className="space-y-1.5 text-sm text-muted-foreground">
        {children}
      </div>
    </div>
  );
}

export function ReviewStep({ form, goToStep }: ReviewStepProps) {
  const values = form.getValues();
  const openingLabel = values.opening ? formatTime(values.opening) : "—";
  const closingLabel = values.closing ? formatTime(values.closing) : "—";

  return (
    <div className="space-y-2">
      <div>
        <h2 className={stepHeadingClass}>Review before you launch</h2>
        <p className={stepSubheadingClass}>
          Double check everything — you can still change it later from your
          dashboard.
        </p>
      </div>

      <Separator className="mt-6 bg-border/50" />

      <ReviewGroup title="Shop details" step={1} goToStep={goToStep}>
        <p className="font-semibold text-foreground">
          {values.name || "—"}
        </p>
        <p className="line-clamp-2">
          {values.description?.replace(/<[^>]*>/g, " ").trim() || "—"}
        </p>
      </ReviewGroup>
      <Separator className="bg-border/50" />

      <ReviewGroup title="Hours & location" step={2} goToStep={goToStep}>
        <p>{values.location || "—"}</p>
        <p>
          {openingLabel} - {closingLabel}
        </p>
      </ReviewGroup>
      <Separator className="bg-border/50" />

      <ReviewGroup title="Pricing" step={3} goToStep={goToStep}>
        <p>Minimum order ₹{values.min_order_value ?? 0}</p>
        <p>Batch delivery fee ₹{values.default_delivery_fee ?? 0}</p>
        <p>Direct delivery fee ₹{values.direct_delivery_fee ?? 0}</p>
      </ReviewGroup>
      <Separator className="bg-border/50" />

      <ReviewGroup title="Delivery batches" step={4} goToStep={goToStep}>
        {values.batch_slots && values.batch_slots.length > 0 ? (
          <p>
            {values.batch_slots
              .map((slot) => minutesToLabel(slot.cutoff_time_minutes))
              .join(", ")}
          </p>
        ) : (
          <p>No batch slots — direct delivery only.</p>
        )}
      </ReviewGroup>
      <Separator className="bg-border/50" />

      <ReviewGroup title="Shop image" step={5} goToStep={goToStep}>
        <p>{values.image ? "Photo uploaded" : "No photo uploaded"}</p>
      </ReviewGroup>
      <Separator className="bg-border/50" />

      <ReviewGroup title="Payments" step={6} goToStep={goToStep}>
        <p>{values.upi_id || "—"}</p>
        <p>{values.qr_image ? "QR code uploaded" : "No QR code uploaded"}</p>
      </ReviewGroup>
    </div>
  );
}
