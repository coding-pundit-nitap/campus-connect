import React from "react";
import { UseFormReturn } from "react-hook-form";

import { BatchCardsEditor } from "@/components/shared/batch-cards-editor";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ShopActionFormData } from "@/validations/shop";

import { stepHeadingClass, stepSubheadingClass } from "./styles";

interface BatchScheduleStepProps {
  form: UseFormReturn<ShopActionFormData>;
  isSubmitting: boolean;
  isLoading: boolean;
}

export function BatchScheduleStep({
  form,
  isSubmitting,
  isLoading,
}: BatchScheduleStepProps) {
  return (
    <div className="space-y-7">
      <div>
        <h2 className={stepHeadingClass}>Plan your delivery batches</h2>
        <p className={stepSubheadingClass}>
          Set cutoff times so nearby orders go out together. Leave empty if you
          only run direct delivery.
        </p>
      </div>
      <FormField
        control={form.control}
        name="batch_slots"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="sr-only">Delivery batch schedule</FormLabel>
            <FormDescription className="sr-only">
              Configure specific batch intervals.
            </FormDescription>
            <FormControl>
              <BatchCardsEditor
                value={field.value || []}
                onChange={field.onChange}
                disabled={isSubmitting || isLoading}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
