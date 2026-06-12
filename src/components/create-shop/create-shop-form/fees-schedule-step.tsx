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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ShopActionFormData } from "@/validations/shop";

interface FeesScheduleStepProps {
  form: UseFormReturn<ShopActionFormData>;
  isSubmitting: boolean;
  isLoading: boolean;
}

export function FeesScheduleStep({
  form,
  isSubmitting,
  isLoading,
}: FeesScheduleStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Fees & Schedule
        </h2>
        <p className="text-xs text-muted-foreground mt-1 font-medium">
          Configure minimum baskets, standard delivery rates, and schedules.
        </p>
      </div>
      <Separator className="bg-border/40" />
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField
            control={form.control}
            name="min_order_value"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Minimum Order Value (₹)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    className="h-11 bg-muted/20 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl transition-all duration-300 font-semibold text-sm"
                    value={field.value ?? 50}
                    onChange={(e) =>
                      field.onChange(e.currentTarget.valueAsNumber)
                    }
                  />
                </FormControl>
                <FormDescription className="text-[11px] text-muted-foreground/80">
                  Minimum cart total required (E.g., ₹50).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="default_delivery_fee"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Batch Delivery Fee (₹)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    className="h-11 bg-muted/20 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl transition-all duration-300 font-semibold text-sm"
                    value={field.value ?? 0}
                    onChange={(e) => {
                      const value = e.currentTarget.valueAsNumber;
                      field.onChange(isNaN(value) ? 0 : value);
                    }}
                  />
                </FormControl>
                <FormDescription className="text-[11px] text-muted-foreground/80">
                  Delivery charge when using batched slots (E.g., ₹10).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="direct_delivery_fee"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Direct Delivery Fee (₹)
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step="1"
                  className="h-11 bg-muted/20 border-border/50 hover:border-border focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded-xl transition-all duration-300 font-semibold text-sm"
                  value={field.value ?? 0}
                  onChange={(e) => {
                    const value = e.currentTarget.valueAsNumber;
                    field.onChange(isNaN(value) ? 0 : value);
                  }}
                />
              </FormControl>
              <FormDescription className="text-[11px] text-muted-foreground/80">
                Additional charge for immediate, non-batched delivery (E.g.,
                ₹20).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="batch_slots"
          render={({ field }) => (
            <FormItem className="pt-2">
              <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Delivery Batch Schedule
              </FormLabel>
              <FormDescription className="text-[11px] text-muted-foreground/80 mb-2">
                Configure specific batch intervals. Leave empty if you only run
                direct delivery.
              </FormDescription>
              <FormControl>
                <div className="rounded-xl border border-border/30 p-4 bg-muted/20 shadow-inner">
                  <BatchCardsEditor
                    value={field.value || []}
                    onChange={field.onChange}
                    disabled={isSubmitting || isLoading}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
