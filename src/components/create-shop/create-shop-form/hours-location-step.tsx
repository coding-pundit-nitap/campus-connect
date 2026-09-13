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

interface HoursLocationStepProps {
  form: UseFormReturn<ShopActionFormData>;
}

export function HoursLocationStep({ form }: HoursLocationStepProps) {
  return (
    <div className="space-y-7">
      <div>
        <h2 className={stepHeadingClass}>Where and when you're open</h2>
        <p className={stepSubheadingClass}>
          Help campus students know when you're open and where to pick up
          orders.
        </p>
      </div>
      <div className="space-y-6">
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={fieldLabelClass}>
                Location / pickup point
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Block A ground floor common room, Main Street..."
                  className={fieldInputClass}
                  {...field}
                />
              </FormControl>
              <FormDescription className={fieldHintClass}>
                Specific description of your physical location on campus.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="opening"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={fieldLabelClass}>Opening time</FormLabel>
                <FormControl>
                  <Input type="time" className={fieldInputClass} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="closing"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={fieldLabelClass}>Closing time</FormLabel>
                <FormControl>
                  <Input type="time" className={fieldInputClass} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}
