import React from "react";
import { UseFormReturn } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ShopActionFormData } from "@/validations/shop";

import {
  fieldHintClass,
  fieldInputClass,
  fieldLabelClass,
  stepHeadingClass,
  stepSubheadingClass,
} from "./styles";

interface PricingStepProps {
  form: UseFormReturn<ShopActionFormData>;
}

export function PricingStep({ form }: PricingStepProps) {
  return (
    <div className="space-y-7">
      <div>
        <h2 className={stepHeadingClass}>Set your pricing</h2>
        <p className={stepSubheadingClass}>
          Decide what students pay to order and get their food delivered.
        </p>
      </div>
      <div className="space-y-6">
        <FormField
          control={form.control}
          name="min_order_value"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={fieldLabelClass}>
                Minimum order value (₹)
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step="1"
                  className={fieldInputClass}
                  value={field.value ?? 50}
                  onChange={(e) => field.onChange(e.currentTarget.valueAsNumber)}
                />
              </FormControl>
              <FormDescription className={fieldHintClass}>
                Minimum cart total required, e.g. ₹50.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="rounded-lg border border-border/50 bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
          <p className="mb-1.5 font-semibold text-foreground">
            Two ways students get their order
          </p>
          <p>
            <span className="font-semibold text-foreground">Batch</span> —
            orders are grouped and delivered together at set times. Cheaper
            for the student, one trip for you.
          </p>
          <p className="mt-1">
            <span className="font-semibold text-foreground">Direct</span> —
            delivered on its own as soon as it&apos;s ready. Costs the
            student more, and is a separate trip for you.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="default_delivery_fee"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={fieldLabelClass}>
                  Batch delivery fee (₹)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    className={fieldInputClass}
                    value={field.value ?? 0}
                    onChange={(e) => {
                      const value = e.currentTarget.valueAsNumber;
                      field.onChange(isNaN(value) ? 0 : value);
                    }}
                  />
                </FormControl>
                <FormDescription className={fieldHintClass}>
                  Charge for batched delivery, e.g. ₹10.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="direct_delivery_fee"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={fieldLabelClass}>
                  Direct delivery fee (₹)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    className={fieldInputClass}
                    value={field.value ?? 0}
                    onChange={(e) => {
                      const value = e.currentTarget.valueAsNumber;
                      field.onChange(isNaN(value) ? 0 : value);
                    }}
                  />
                </FormControl>
                <FormDescription className={fieldHintClass}>
                  Charge for immediate delivery, e.g. ₹20.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}
